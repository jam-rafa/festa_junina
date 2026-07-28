import { createArrestRequest } from "../api/queueApi.js";
import { ArrestRequestForm } from "../components/ArrestRequestForm.jsx";
import { useState } from "react";

const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCurrencyFromCents(valueInCents) {
  return CURRENCY_FORMATTER.format(valueInCents / 100);
}

export function ArrestRequestPage() {
  const [createdRequest, setCreatedRequest] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleSubmit(formValues) {
    try {
      const request = await createArrestRequest(formValues);
      setErrorMessage(null);
      return request;
    } catch (error) {
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
          <h1 className="mt-2 text-3xl font-bold">Pedir prisão</h1>
          <p className="mt-3 text-base text-stone-700">
            Informe quem deve ir para a cadeia. Cada pedido custa{" "}
            <strong>{formatCurrencyFromCents(300)}</strong> e vale{" "}
            <strong>5 minutos</strong>.
          </p>

          <ArrestRequestForm onSubmit={handleSubmit} onSuccess={setCreatedRequest} />

          {errorMessage && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
              {errorMessage}
            </p>
          )}

          {createdRequest && (
            <div className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-900">
              Pedido enviado para o ADM confirmar o pagamento e organizar a
              prisão de <strong>{createdRequest.targetName}</strong>.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
