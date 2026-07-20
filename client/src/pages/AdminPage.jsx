import { useState } from "react";
import { useRealtimeQueue } from "../hooks/useRealtimeQueue.js";
import { useRealtimeArrestRequests } from "../hooks/useRealtimeArrestRequests.js";
import {
  acceptArrestRequest,
  addGuestToQueue,
  clearAdminToken,
  confirmArrestRequestPayment,
  getAdminToken,
  loginAdmin,
  rejectArrestRequest,
  removeGuestFromQueue,
  updateGuestInQueue,
} from "../api/queueApi.js";
import { calculateRemainingMinutes } from "../remainingTime.js";

const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrencyFromCents(valueInCents) {
  return CURRENCY_FORMATTER.format(valueInCents / 100);
}

function EmptyState({ children }) {
  return (
    <div className="rounded-md border border-dashed border-stone-300 bg-white px-4 py-6 text-center text-sm text-stone-500">
      {children}
    </div>
  );
}

function SectionTitle({ title, count }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-stone-950">{title}</h2>
      <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-bold text-stone-700">
        {count}
      </span>
    </div>
  );
}

function AdminButton({ children, variant = "secondary", ...props }) {
  const variants = {
    primary: "bg-red-700 text-white hover:bg-red-800 disabled:bg-stone-400",
    secondary: "bg-stone-900 text-white hover:bg-stone-800 disabled:bg-stone-400",
    success: "bg-green-700 text-white hover:bg-green-800 disabled:bg-stone-400",
    danger: "bg-white text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:text-stone-400",
  };

  return (
    <button
      className={`w-full rounded-md px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed ${variants[variant]}`}
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

function ArrestRequestCard({ request, onConfirmPayment, onAccept, onReject, isBusy }) {
  const isPaymentConfirmed = request.paymentStatus === "confirmed";

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-stone-950">{request.targetName}</h3>
          <p className="mt-1 text-sm text-stone-600">
            {formatCurrencyFromCents(request.priceCents)} por {request.durationMinutes} min
          </p>
        </div>
        <span
          className={
            isPaymentConfirmed
              ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800"
              : "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800"
          }
        >
          {isPaymentConfirmed ? "Pago" : "Pendente"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <AdminButton
          type="button"
          variant="success"
          onClick={() => onConfirmPayment(request.id)}
          disabled={isBusy || isPaymentConfirmed}
        >
          Confirmar pagamento
        </AdminButton>
        <AdminButton
          type="button"
          variant="primary"
          onClick={() => onAccept(request.id)}
          disabled={isBusy || !isPaymentConfirmed}
        >
          Prender
        </AdminButton>
        <div className="col-span-2">
          <AdminButton
            type="button"
            variant="danger"
            onClick={() => onReject(request.id)}
            disabled={isBusy}
          >
            Recusar pedido
          </AdminButton>
        </div>
      </div>
    </article>
  );
}

function NewGuestForm({ onError }) {
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
      onError(null);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-bold text-stone-950">Adicionar preso manualmente</h3>
      <div className="mt-3 grid gap-3">
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Nome</span>
          <input
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
            type="text"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Minutos</span>
          <input
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
            type="number"
            value={holdDurationMinutes}
            onChange={(event) => setHoldDurationMinutes(event.target.value)}
            required
            min="1"
          />
        </label>
        <AdminButton type="submit" variant="secondary" disabled={isSubmitting}>
          {isSubmitting ? "Adicionando..." : "Adicionar preso"}
        </AdminButton>
      </div>
    </form>
  );
}

function GuestListItem({ guest, onError }) {
  const [isEditing, setIsEditing] = useState(false);
  const [guestName, setGuestName] = useState(guest.guestName);
  const [holdDurationMinutes, setHoldDurationMinutes] = useState(guest.holdDurationMinutes);
  const [isSaving, setIsSaving] = useState(false);

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
      <li className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3">
          <input
            className="rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
          />
          <input
            className="rounded-md border border-stone-300 px-3 py-2 outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
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
    <li className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-stone-950">{guest.guestName}</h3>
          <p className="mt-1 text-sm font-semibold text-stone-600">
            {calculateRemainingMinutes(guest, new Date())} min restantes
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <AdminButton type="button" variant="secondary" onClick={() => setIsEditing(true)}>
          Editar
        </AdminButton>
        <AdminButton type="button" variant="danger" onClick={handleRemove}>
          Remover
        </AdminButton>
      </div>
    </li>
  );
}

export function AdminPage() {
  const [adminToken, setAdminToken] = useState(() => getAdminToken());
  const isAuthenticated = Boolean(adminToken);
  const guests = useRealtimeQueue({ enabled: isAuthenticated });
  const arrestRequests = useRealtimeArrestRequests({ enabled: isAuthenticated });
  const [errorMessage, setErrorMessage] = useState(null);
  const [busyRequestId, setBusyRequestId] = useState(null);

  const pendingRequests = arrestRequests.filter((request) => request.status === "pending");

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

  function handleLogout() {
    clearAdminToken();
    setAdminToken(null);
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setAdminToken(getAdminToken())} />;
  }

  return (
    <main className="max-w-none bg-stone-100 px-4 py-5 text-stone-950">
      <div className="mx-auto max-w-xl space-y-6">
        <header>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
                Administração
              </p>
              <h1 className="mt-1 text-3xl font-bold">Cadeia da festa</h1>
            </div>
            <button
              className="rounded-md bg-white px-3 py-2 text-sm font-bold text-stone-700 ring-1 ring-stone-200"
              type="button"
              onClick={handleLogout}
            >
              Sair
            </button>
          </div>
        </header>

        {errorMessage && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
            {errorMessage}
          </p>
        )}

        <section>
          <SectionTitle title="Pedidos de prisão" count={pendingRequests.length} />
          <div className="space-y-3">
            {pendingRequests.length === 0 ? (
              <EmptyState>Nenhum pedido de prisão pendente.</EmptyState>
            ) : (
              pendingRequests.map((request) => (
                <ArrestRequestCard
                  key={request.id}
                  request={request}
                  isBusy={busyRequestId === request.id}
                  onConfirmPayment={(id) => runRequestAction(id, confirmArrestRequestPayment)}
                  onAccept={(id) => runRequestAction(id, acceptArrestRequest)}
                  onReject={(id) => runRequestAction(id, rejectArrestRequest)}
                />
              ))
            )}
          </div>
        </section>

        <section>
          <SectionTitle title="Presos atuais" count={guests.length} />
          <div className="space-y-3">
            <NewGuestForm onError={setErrorMessage} />
            {guests.length === 0 ? (
              <EmptyState>Ninguém está preso agora.</EmptyState>
            ) : (
              <ul className="space-y-3">
                {guests.map((guest) => (
                  <GuestListItem key={guest.id} guest={guest} onError={setErrorMessage} />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
