import { useState } from "react";
import { createArrestRequest } from "../api/queueApi.js";

const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrencyFromCents(valueInCents) {
  return CURRENCY_FORMATTER.format(valueInCents / 100);
}

export function ArrestRequestPage() {
  const [targetName, setTargetName] = useState("");
  const [createdRequest, setCreatedRequest] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const request = await createArrestRequest({ targetName });
      setCreatedRequest(request);
      setTargetName("");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh max-w-none bg-amber-50 px-4 py-6 text-stone-950">
      <section className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-md flex-col justify-center">
        <div className="rounded-lg border border-amber-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
            Cadeia da festa
          </p>
          <h1 className="mt-2 text-3xl font-bold">Pedir prisão</h1>
          <p className="mt-3 text-base text-stone-700">
            Informe quem deve ir para a cadeia. Cada pedido custa{" "}
            <strong>{formatCurrencyFromCents(300)}</strong> e vale{" "}
            <strong>5 minutos</strong>.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-stone-800">Nome do procurado</span>
              <input
                className="mt-2 w-full rounded-md border border-stone-300 px-4 py-3 text-base outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                type="text"
                value={targetName}
                onChange={(event) => setTargetName(event.target.value)}
                placeholder="Ex: João Silva"
                required
              />
            </label>

            <button
              className="w-full rounded-md bg-red-700 px-4 py-3 font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar pedido"}
            </button>
          </form>

          {errorMessage && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
              {errorMessage}
            </p>
          )}

          {createdRequest && (
            <div className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-900">
              Pedido enviado para o ADM confirmar o pagamento e organizar a prisão de{" "}
              <strong>{createdRequest.targetName}</strong>.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
