import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useRealtimeQueue } from "../hooks/useRealtimeQueue.js";
import { useRealtimeArrestRequests } from "../hooks/useRealtimeArrestRequests.js";
import {
  acceptArrestRequest,
  addGuestToQueue,
  clearAdminToken,
  createAdminArrestRequest,
  createPaymentVoucher,
  getAdminToken,
  loginAdmin,
  rejectArrestRequest,
  removeGuestFromQueue,
  reuseArrestRequestImage,
  updateGuestInQueue,
} from "../api/queueApi.js";
import { deleteEventScreenBanner, updateEventScreenBanner, uploadEventScreenBanner } from "../api/eventScreenApi.js";
import { ArrestRequestForm } from "../components/ArrestRequestForm.jsx";
import {
  EVENT_SCREEN_BANNERS,
  findEventScreenBannerById,
} from "../eventScreenBanners.js";
import { useEventScreenBanner } from "../hooks/useEventScreenBanner.js";
import { calculateRemainingMinutes, hasGuestFinishedWaiting } from "../remainingTime.js";

const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrencyFromCents(valueInCents) {
  return CURRENCY_FORMATTER.format(valueInCents / 100);
}

function normalizeComparableName(name) {
  return name
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function findReusableImageRequest(currentRequest, requests) {
  if (currentRequest.targetImagePath) {
    return null;
  }

  const currentName = normalizeComparableName(currentRequest.targetName);
  return [...requests]
    .reverse()
    .find(
      (request) =>
        request.id !== currentRequest.id &&
        request.targetImagePath &&
        normalizeComparableName(request.targetName) === currentName
    );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white px-3 py-4 text-center text-sm font-medium text-stone-500">
      {children}
    </div>
  );
}

function SectionTitle({ title, count }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h2 className="text-base font-black text-stone-950">{title}</h2>
      <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-bold text-stone-700">
        {count}
      </span>
    </div>
  );
}

function AdminButton({ children, variant = "secondary", className = "", ...props }) {
  const variants = {
    primary: "bg-red-700 text-white hover:bg-red-800 disabled:bg-stone-400",
    secondary: "bg-stone-900 text-white hover:bg-stone-800 disabled:bg-stone-400",
    success: "bg-green-700 text-white hover:bg-green-800 disabled:bg-stone-400",
    danger: "bg-white text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:text-stone-400",
  };

  return (
    <button
      className={`w-full rounded-md px-2.5 py-2 text-xs font-bold transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function AdminLogin({ onLogin }) {
  const [pin, setPin] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await loginAdmin({ pin });
      setErrorMessage(null);
      onLogin();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh max-w-none bg-stone-100 px-4 py-6 text-stone-950">
      <section className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-sm flex-col justify-center">
        <form onSubmit={handleSubmit} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
            Administração 
          </p>
          <h1 className="mt-2 text-3xl font-bold">Acesso do ADM</h1>
          <label className="mt-6 block">
            <span className="text-sm font-semibold text-stone-700">PIN de acesso</span>
            <input
              className="mt-2 w-full rounded-md border border-stone-300 px-4 py-3 text-center text-2xl font-bold tracking-[0.35em] outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              required
            />
          </label>
          <button
            className="mt-4 w-full rounded-md bg-red-700 px-4 py-3 font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-stone-400"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
          {errorMessage && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
              {errorMessage}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

function ArrestRequestCard({
  request,
  reusableImageRequest,
  onReuseImage,
  onAccept,
  onReject,
  isBusy,
}) {
  const isPaymentConfirmed = request.paymentStatus === "confirmed";

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        {request.targetImagePath ? (
          <img
            className="h-16 w-16 shrink-0 rounded-md border border-stone-200 object-cover"
            src={request.targetImagePath}
            alt={`Foto de ${request.targetName}`}
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-dashed border-stone-300 bg-stone-50 text-xs font-bold text-stone-400">
            Foto
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black text-stone-950">{request.targetName}</h3>
              <p className="mt-0.5 text-xs font-semibold text-stone-600">
                {formatCurrencyFromCents(request.priceCents)} · {request.durationMinutes} min
              </p>
              {request.requesterName ? (
                <p className="mt-1 text-xs text-stone-600">
                  Solicitado por <strong>{request.requesterName}</strong>
                </p>
              ) : null}
            </div>
            <span
              className={
                isPaymentConfirmed
                  ? "shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800"
                  : "shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800"
              }
            >
              {isPaymentConfirmed ? "Pago" : "Pendente"}
            </span>
          </div>
        </div>
      </div>

      {reusableImageRequest ? (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-stone-50 p-2 ring-1 ring-stone-200">
          <img
            className="h-10 w-10 shrink-0 rounded object-cover"
            src={reusableImageRequest.targetImagePath}
            alt={`Foto anterior de ${request.targetName}`}
          />
          <p className="min-w-0 flex-1 text-xs font-semibold text-stone-600">
            Foto anterior encontrada
          </p>
          <button
            className="shrink-0 rounded-md bg-stone-900 px-2.5 py-2 text-xs font-bold text-white disabled:bg-stone-400"
            type="button"
            onClick={() => onReuseImage(request.id, reusableImageRequest.id)}
            disabled={isBusy}
          >
            Usar
          </button>
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <AdminButton
          type="button"
          variant="primary"
          onClick={() => onAccept(request.id)}
          disabled={isBusy || !isPaymentConfirmed}
        >
          Prender
        </AdminButton>
        <AdminButton
          type="button"
          variant="danger"
          onClick={() => onReject(request.id)}
          disabled={isBusy}
        >
          Recusar
        </AdminButton>
      </div>
    </article>
  );
}

function VoucherQrCode({ accessLink }) {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    QRCode.toDataURL(accessLink, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1c1917", light: "#ffffff" },
    })
      .then((nextImageUrl) => {
        if (isCurrent) {
          setImageUrl(nextImageUrl);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setImageUrl(null);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [accessLink]);

  return imageUrl ? (
    <img className="mx-auto mt-3 w-40 rounded-md bg-white p-2" src={imageUrl} alt="QR Code do vale pago" />
  ) : null;
}

function ManualArrestRequestForm({ onError }) {
  const [isOpen, setIsOpen] = useState(false);

  async function handleSubmit(formValues) {
    try {
      const createdRequest = await createAdminArrestRequest(formValues);
      onError(null);
      return createdRequest;
    } catch (error) {
      onError(error.message);
      throw error;
    }
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <button
        className="flex w-full items-center justify-between gap-3 text-left text-sm font-black text-stone-950"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>Cadastrar pedido manual</span>
        <span className="rounded-full bg-stone-900 px-2 py-1 text-xs font-bold text-white">
          {isOpen ? "Fechar" : "Abrir"}
        </span>
      </button>
      {isOpen ? (
        <>
          <p className="mt-2 text-xs leading-5 text-stone-600">
            Para pedidos feitos diretamente pelo atendente. Eles já entram como pagos.
          </p>
          <ArrestRequestForm
            onSubmit={handleSubmit}
            submitLabel="Cadastrar pedido pago"
            submittingLabel="Cadastrando..."
            onSuccess={() => setIsOpen(false)}
          />
        </>
      ) : null}
    </div>
  );
}

function PaidVoucherForm({ onError }) {
  const [voucher, setVoucher] = useState(null);
  const [maxUses, setMaxUses] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  async function generateVoucher() {
    setIsGenerating(true);
    try {
      setVoucher(await createPaymentVoucher(maxUses));
      setIsCopied(false);
      onError(null);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyAccessLink() {
    if (!voucher) {
      return;
    }

    const accessLink = `${window.location.origin}/pedir-prisao?vale=${voucher.code}`;
    try {
      await navigator.clipboard.writeText(accessLink);
      setIsCopied(true);
    } catch {
      onError("Não foi possível copiar o link. Entregue o código mostrado.");
    }
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-black text-stone-950">Pagamento recebido</p>
      <p className="mt-1 text-xs leading-5 text-stone-600">
        Receba o dinheiro e gere um vale. A pessoa só poderá cadastrar foto e nome com esse código.
      </p>
      <label className="mt-3 block">
        <span className="text-xs font-bold text-stone-700">Quantidade de registros permitidos</span>
        <span className="mt-2 grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((quantity) => (
            <button
              key={quantity}
              className={`rounded-md border px-2 py-2 text-sm font-black transition ${
                Number(maxUses) === quantity
                  ? "border-red-700 bg-red-700 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:border-red-400"
              }`}
              type="button"
              aria-pressed={Number(maxUses) === quantity}
              onClick={() => setMaxUses(quantity)}
            >
              {quantity}
            </button>
          ))}
        </span>
        <input
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
          type="number"
          min="1"
          max="100"
          step="1"
          value={maxUses}
          onChange={(event) => setMaxUses(event.target.value)}
          required
        />
      </label>
      {voucher ? (
        <div className="mt-3 rounded-md bg-green-50 p-3 text-center ring-1 ring-green-200">
          <p className="text-xs font-bold uppercase tracking-wide text-green-800">Vale pago</p>
          <p className="mt-1 font-mono text-3xl font-black tracking-[0.18em] text-stone-950">{voucher.code}</p>
          <p className="mt-2 text-xs font-medium text-green-900">
            Sem prazo de expiração · {voucher.maxUses} {voucher.maxUses === 1 ? "registro" : "registros"}
          </p>
          <VoucherQrCode accessLink={`${window.location.origin}/pedir-prisao?vale=${voucher.code}`} />
          <p className="mt-2 text-xs font-medium text-green-900">Ou peça para a pessoa apontar a câmera para o QR Code.</p>
          <button
            className="mt-3 w-full rounded-md bg-stone-900 px-3 py-2 text-xs font-bold text-white"
            type="button"
            onClick={copyAccessLink}
          >
            {isCopied ? "Link copiado" : "Copiar link para a pessoa"}
          </button>
          <button
            className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700"
            type="button"
            onClick={() => setVoucher(null)}
          >
            Fechar vale
          </button>
        </div>
      ) : null}
      <AdminButton
        className="mt-3"
        type="button"
        variant="success"
        onClick={generateVoucher}
        disabled={isGenerating}
      >
        {isGenerating ? "Gerando vale..." : "Gerar vale pago"}
      </AdminButton>
    </div>
  );
}

function NewGuestForm({ onError }) {
  const [isOpen, setIsOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [holdDurationMinutes, setHoldDurationMinutes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await addGuestToQueue({ guestName, holdDurationMinutes: Number(holdDurationMinutes) });
      setGuestName("");
      setHoldDurationMinutes("");
      setIsOpen(false);
      onError(null);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <button
        className="flex w-full items-center justify-between gap-3 text-left text-sm font-black text-stone-950"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>Adicionar preso</span>
        <span className="rounded-full bg-stone-900 px-2 py-1 text-xs font-bold text-white">
          {isOpen ? "Fechar" : "Abrir"}
        </span>
      </button>
      {isOpen ? (
      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_96px]">
        <label className="block sm:col-span-2">
          <span className="text-xs font-bold text-stone-700">Nome</span>
          <input
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
            type="text"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-stone-700">Minutos</span>
          <input
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
            type="number"
            value={holdDurationMinutes}
            onChange={(event) => setHoldDurationMinutes(event.target.value)}
            required
            min="1"
          />
        </label>
        <div className="flex items-end">
          <AdminButton type="submit" variant="secondary" disabled={isSubmitting}>
            {isSubmitting ? "Adicionando..." : "Adicionar"}
          </AdminButton>
        </div>
      </div>
      ) : null}
    </form>
  );
}

function EventScreenBannerForm({ onError }) {
  const { bannerId, banners, refreshBanners } = useEventScreenBanner();
  const [selectedBannerId, setSelectedBannerId] = useState(bannerId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedBannerId(bannerId);
  }, [bannerId]);

  const selectedBanner = findEventScreenBannerById(selectedBannerId, banners);

  async function handleUpload(event) {
    const image = event.target.files?.[0];
    if (!image) return;
    setIsSubmitting(true);
    try { await uploadEventScreenBanner(image); await refreshBanners(); onError(null); }
    catch (error) { onError(error.message); }
    finally { setIsSubmitting(false); event.target.value = ""; }
  }

  async function handleDelete(id) {
    if (!window.confirm("Excluir este banner personalizado?")) return;
    setIsSubmitting(true);
    try {
      await deleteEventScreenBanner(id);
      await refreshBanners();
      if (selectedBannerId === id) setSelectedBannerId(bannerId);
      onError(null);
    } catch (error) { onError(error.message); }
    finally { setIsSubmitting(false); }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await updateEventScreenBanner({ bannerId: selectedBannerId });
      onError(null);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-stone-950">Banner do telão</h3>
        <span className="truncate text-xs font-bold text-stone-500">{selectedBanner.label}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {banners.map((banner) => {
          const isSelected = banner.id === selectedBannerId;

          return (
            <div
              key={banner.id}
              className={
                isSelected
                  ? "cursor-pointer rounded-lg border-2 border-red-700 bg-red-50 p-2"
                  : "cursor-pointer rounded-lg border border-stone-200 bg-white p-2"
              }
            >
              <label className="block cursor-pointer">
              <input
                className="sr-only"
                type="radio"
                name="event-screen-banner"
                value={banner.id}
                checked={isSelected}
                onChange={(event) => setSelectedBannerId(event.target.value)}
              />
              <div
                className="aspect-video w-full rounded-md border border-stone-200 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${banner.imageUrl})` }}
                aria-hidden="true"
              />
              <p className="mt-1 truncate text-xs font-bold text-stone-950">{banner.label}</p>
              </label>
              {banner.removable ? <button className="mt-2 w-full rounded-md border border-red-200 px-2 py-1 text-xs font-bold text-red-700" type="button" onClick={() => handleDelete(banner.id)}>Excluir</button> : null}
            </div>
          );
        })}
      </div>

      <label className="mt-3 block rounded-md border border-dashed border-stone-300 px-3 py-3 text-center text-sm font-bold text-stone-700">
        {isSubmitting ? "Enviando..." : "Adicionar imagem de fundo"}
        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} disabled={isSubmitting} />
      </label>

      <div className="mt-3">
        <AdminButton
          type="submit"
          variant="secondary"
          disabled={isSubmitting || selectedBannerId === bannerId}
        >
          {isSubmitting ? "Salvando..." : "Salvar banner do telão"}
        </AdminButton>
      </div>
    </form>
  );
}

function GuestListItem({ guest, now, onError }) {
  const [isEditing, setIsEditing] = useState(false);
  const [guestName, setGuestName] = useState(guest.guestName);
  const [holdDurationMinutes, setHoldDurationMinutes] = useState(guest.holdDurationMinutes);
  const [isSaving, setIsSaving] = useState(false);
  const remainingMinutes = calculateRemainingMinutes(guest, now);
  const isReady = hasGuestFinishedWaiting(guest, now);

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateGuestInQueue(guest.id, { guestName, holdDurationMinutes: Number(holdDurationMinutes) });
      setIsEditing(false);
      onError(null);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove() {
    try {
      await removeGuestFromQueue(guest.id);
      onError(null);
    } catch (error) {
      onError(error.message);
    }
  }

  if (isEditing) {
    return (
      <li className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2">
          <input
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
          />
          <input
            className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
            type="number"
            value={holdDurationMinutes}
            onChange={(event) => setHoldDurationMinutes(event.target.value)}
            min="1"
          />
          <div className="grid grid-cols-2 gap-2">
            <AdminButton type="button" variant="success" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </AdminButton>
            <AdminButton type="button" variant="danger" onClick={() => setIsEditing(false)}>
              Cancelar
            </AdminButton>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      className={
        isReady
          ? "rounded-lg border-2 border-green-600 bg-green-50 p-3 shadow-sm"
          : "rounded-lg border border-stone-200 bg-white p-3 shadow-sm"
      }
    >
      <div className="flex gap-3">
        {guest.targetImagePath ? (
          <img
            className="h-14 w-14 shrink-0 rounded-md border border-stone-200 object-cover"
            src={guest.targetImagePath}
            alt={`Foto de ${guest.guestName}`}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-black text-stone-950">{guest.guestName}</h3>
          <p
            className={
              isReady
                ? "mt-0.5 text-sm font-black text-green-800"
                : "mt-0.5 text-xs font-semibold text-stone-600"
            }
          >
            {isReady ? "Pode soltar agora" : `${remainingMinutes} min restantes`}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <AdminButton type="button" variant="secondary" onClick={() => setIsEditing(true)}>
          Editar
        </AdminButton>
        <AdminButton type="button" variant={isReady ? "success" : "danger"} onClick={handleRemove}>
          {isReady ? "Soltar" : "Soltar agora"}
        </AdminButton>
      </div>
    </li>
  );
}

function AdminSectionTabs({ activeSection, onChange, pendingRequestsCount, guestsCount }) {
  const items = [
    { id: "requests", label: "Pedidos", count: pendingRequestsCount },
    { id: "guests", label: "Presos", count: guestsCount },
    { id: "screen", label: "Telão", count: EVENT_SCREEN_BANNERS.length },
  ];

  return (
    <div className="sticky top-0 z-10 -mx-1 bg-[#f7ecd0]/95 px-1 py-2 backdrop-blur supports-[backdrop-filter]:bg-[#f7ecd0]/85">
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-stone-200 bg-white p-1 shadow-sm">
        {items.map((item) => {
          const isActive = item.id === activeSection;

          return (
            <button
              key={item.id}
              className={
                isActive
                  ? "rounded-md bg-stone-900 px-2 py-2 text-xs font-black text-white shadow-sm"
                  : "rounded-md px-2 py-2 text-xs font-bold text-stone-700"
              }
              type="button"
              onClick={() => onChange(item.id)}
            >
              {item.label} <span className="opacity-75">{item.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AdminPage() {
  const [adminToken, setAdminToken] = useState(() => getAdminToken());
  const isAuthenticated = Boolean(adminToken);
  const guests = useRealtimeQueue({ enabled: isAuthenticated });
  const arrestRequests = useRealtimeArrestRequests({ enabled: isAuthenticated });
  const [errorMessage, setErrorMessage] = useState(null);
  const [busyRequestId, setBusyRequestId] = useState(null);
  const [activeSection, setActiveSection] = useState("requests");
  const [now, setNow] = useState(() => new Date());

  const pendingRequests = arrestRequests.filter((request) => request.status === "pending");
  const readyGuestsCount = guests.filter((guest) => hasGuestFinishedWaiting(guest, now)).length;

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  async function runRequestAction(requestId, action) {
    setBusyRequestId(requestId);
    try {
      await action(requestId);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setBusyRequestId(null);
    }
  }

  async function handleReuseImage(requestId, sourceRequestId) {
    setBusyRequestId(requestId);
    try {
      await reuseArrestRequestImage(requestId, { sourceRequestId });
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setBusyRequestId(null);
    }
  }

  function handleLogout() {
    clearAdminToken();
    setAdminToken(null);
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setAdminToken(getAdminToken())} />;
  }

  return (
    <main className="max-w-none bg-[#f7ecd0] px-3 py-3 text-stone-950">
      <div className="mx-auto max-w-xl space-y-3">
        <header className="rounded-lg bg-[#8f2f1f] px-3 py-3 text-white shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-200">
                Administração
              </p>
              <h1 className="text-lg font-black">Cadeia da festa</h1>
            </div>
            <button
              className="rounded-md bg-white/95 px-3 py-2 text-xs font-bold text-stone-800 shadow-sm"
              type="button"
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </header>

        {errorMessage && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
            {errorMessage}
          </p>
        )}

        <AdminSectionTabs
          activeSection={activeSection}
          onChange={setActiveSection}
          pendingRequestsCount={pendingRequests.length}
          guestsCount={guests.length}
        />

        {activeSection === "requests" ? (
          <section>
            <SectionTitle
              title="Pedidos de prisão"
              count={pendingRequests.length}
            />
            <div className="space-y-2">
              <PaidVoucherForm onError={setErrorMessage} />
              <ManualArrestRequestForm onError={setErrorMessage} />
              {pendingRequests.length === 0 ? (
                <EmptyState>Nenhum pedido de prisão pendente.</EmptyState>
              ) : (
                pendingRequests.map((request) => (
                  <ArrestRequestCard
                    key={request.id}
                    request={request}
                    reusableImageRequest={findReusableImageRequest(request, arrestRequests)}
                    isBusy={busyRequestId === request.id}
                    onReuseImage={handleReuseImage}
                    onAccept={(id) => runRequestAction(id, acceptArrestRequest)}
                    onReject={(id) => runRequestAction(id, rejectArrestRequest)}
                  />
                ))
              )}
            </div>
          </section>
        ) : null}

        {activeSection === "guests" ? (
          <section>
            <SectionTitle
              title="Presos atuais"
              count={guests.length}
            />
            <div className="space-y-2">
              <NewGuestForm onError={setErrorMessage} />
              {readyGuestsCount > 0 ? (
                <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-black text-green-800">
                  {readyGuestsCount === 1
                    ? "1 pessoa pode ser solta agora."
                    : `${readyGuestsCount} pessoas podem ser soltas agora.`}
                </p>
              ) : null}
              {guests.length === 0 ? (
                <EmptyState>Ninguém está preso agora.</EmptyState>
              ) : (
                <ul className="space-y-2">
                  {guests.map((guest) => (
                    <GuestListItem key={guest.id} guest={guest} now={now} onError={setErrorMessage} />
                  ))}
                </ul>
              )}
            </div>
          </section>
        ) : null}

        {activeSection === "screen" ? (
          <section>
            <SectionTitle
              title="Telão do evento"
              count={EVENT_SCREEN_BANNERS.length}
            />
            <EventScreenBannerForm onError={setErrorMessage} />
          </section>
        ) : null}
      </div>
    </main>
  );
}
