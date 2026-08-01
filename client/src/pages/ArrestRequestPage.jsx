import { createArrestRequest, validatePaymentVoucher } from "../api/queueApi.js";
import { ArrestRequestForm } from "../components/ArrestRequestForm.jsx";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const REQUESTER_NAME_STORAGE_KEY = "festa-junina:arrest-requester-name";
const VOUCHER_CODE_STORAGE_KEY = "festa-junina:arrest-voucher-code";

function getSavedRequesterName() {
  try {
    return window.localStorage.getItem(REQUESTER_NAME_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function getSavedVoucherCode() {
  try {
    return window.localStorage.getItem(VOUCHER_CODE_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function ArrestRequestPage() {
  const [searchParams] = useSearchParams();
  const [voucherCode, setVoucherCode] = useState(
    () => searchParams.get("vale") ?? getSavedVoucherCode()
  );
  const [isVoucherValid, setIsVoucherValid] = useState(false);
  const [remainingUses, setRemainingUses] = useState(0);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [requesterName, setRequesterName] = useState(getSavedRequesterName);
  const [hasSavedRequesterName, setHasSavedRequesterName] = useState(() =>
    Boolean(getSavedRequesterName().trim())
  );

  async function checkVoucher(code = voucherCode) {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      setErrorMessage("Digite o código recebido na cadeia.");
      return;
    }

    setIsCheckingVoucher(true);
    try {
      const { isValid, remainingUses: nextRemainingUses } = await validatePaymentVoucher(normalizedCode);
      setIsVoucherValid(isValid);
      setRemainingUses(nextRemainingUses ?? 0);
      if (isValid) {
        try {
          window.localStorage.setItem(VOUCHER_CODE_STORAGE_KEY, normalizedCode);
        } catch {
          // O vale continua utilizável mesmo sem armazenamento local.
        }
      }
      setErrorMessage(isValid ? null : "Este vale é inválido ou já atingiu o limite de registros.");
    } catch (error) {
      setIsVoucherValid(false);
      setErrorMessage(error.message);
    } finally {
      setIsCheckingVoucher(false);
    }
  }

  useEffect(() => {
    if (voucherCode) {
      checkVoucher(voucherCode);
    }
    // O link entregue pelo caixa já traz o vale preenchido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(formValues) {
    try {
      const request = await createArrestRequest({ ...formValues, voucherCode });
      const normalizedRequesterName = formValues.requesterName.trim();
      try {
        window.localStorage.setItem(REQUESTER_NAME_STORAGE_KEY, normalizedRequesterName);
      } catch {
        // O pedido continua válido mesmo quando o navegador não permite armazenamento local.
      }
      setHasSavedRequesterName(true);
      setRemainingUses(request.remainingUses ?? 0);
      setErrorMessage(null);
      return request;
    } catch (error) {
      setIsVoucherValid(false);
      setErrorMessage(error.message);
      throw error;
    }
  }

  return (
    <main className="min-h-dvh max-w-none bg-amber-50 px-4 py-6 text-stone-950">
      <section className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-md flex-col justify-center">
        <div className="rounded-lg border border-amber-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
            Cadeia da festa
          </p>
          <h1 className="mt-2 text-3xl font-bold">Registrar prisão</h1>

          {!isVoucherValid && !createdRequest ? (
            <form
              className="mt-6 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                checkVoucher();
              }}
            >
              <p className="rounded-md bg-amber-50 px-3 py-3 text-sm leading-5 text-stone-700">
                Primeiro faça o pagamento na cadeia. Depois, digite o código que o atendente entregar.
              </p>
              <label className="block">
                <span className="text-sm font-semibold text-stone-800">Código do vale pago</span>
                <input
                  className="mt-2 w-full rounded-md border border-stone-300 px-4 py-3 text-center text-xl font-black uppercase tracking-[0.25em] outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                  type="text"
                  value={voucherCode}
                  onChange={(event) => {
                    setVoucherCode(event.target.value.toUpperCase());
                    setIsVoucherValid(false);
                    setErrorMessage(null);
                  }}
                  placeholder="ABC123"
                  autoCapitalize="characters"
                  autoComplete="one-time-code"
                  maxLength="6"
                  required
                />
              </label>
              <button
                className="w-full rounded-md bg-stone-900 px-4 py-3 font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                type="submit"
                disabled={isCheckingVoucher}
              >
                {isCheckingVoucher ? "Verificando..." : "Continuar"}
              </button>
            </form>
          ) : null}

          {isVoucherValid && !createdRequest ? (
            <>
              <div className="mt-5 rounded-md bg-green-50 px-3 py-3 text-sm font-medium text-green-900 ring-1 ring-green-200">
                Pagamento confirmado. Agora registre a pessoa procurada.
              </div>
              <ArrestRequestForm
                onSubmit={handleSubmit}
                submitLabel="Enviar pedido pago"
                submittingLabel="Enviando pedido..."
                onSuccess={setCreatedRequest}
                requesterName={requesterName}
                onRequesterNameChange={setRequesterName}
                requiresRequesterName={!hasSavedRequesterName}
              />
              <p className="mt-3 text-center text-sm font-semibold text-stone-700">
                Este vale ainda permite {remainingUses} {remainingUses === 1 ? "registro" : "registros"}.
              </p>
            </>
          ) : null}

          {errorMessage && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
              {errorMessage}
            </p>
          )}

          {createdRequest && (
            <div className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-900">
              Pedido pago enviado para a cadeia organizar a prisão de{" "}
              <strong>{createdRequest.targetName}</strong>. Este vale ainda permite {remainingUses}{" "}
              {remainingUses === 1 ? "registro" : "registros"}.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
