import { useEffect, useState } from "react";

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp";
const ACCEPTED_IMAGE_TYPE_LIST = ACCEPTED_IMAGE_TYPES.split(",");
const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;

export function ArrestRequestForm({
  onSubmit,
  submitLabel = "Enviar pedido",
  submittingLabel = "Enviando...",
  onSuccess,
  requesterName = "",
  onRequesterNameChange,
  requiresRequesterName = false,
}) {
  const [targetName, setTargetName] = useState("");
  const [targetImage, setTargetImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [validationMessage, setValidationMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!targetImage) {
      setImagePreviewUrl(null);
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(targetImage);
    setImagePreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [targetImage]);

  function handleImageChange(event) {
    const nextImage = event.target.files?.[0] ?? null;
    setValidationMessage(null);

    if (!nextImage) {
      setTargetImage(null);
      return;
    }

    if (!ACCEPTED_IMAGE_TYPE_LIST.includes(nextImage.type)) {
      setTargetImage(null);
      event.target.value = "";
      setValidationMessage("Envie uma imagem JPG, PNG ou WebP.");
      return;
    }

    if (nextImage.size > MAX_IMAGE_SIZE_BYTES) {
      setTargetImage(null);
      event.target.value = "";
      setValidationMessage("A imagem deve ter no máximo 3MB.");
      return;
    }

    setTargetImage(nextImage);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!targetImage && !window.confirm("Deseja prosseguir sem adicionar uma foto?")) {
      return;
    }

    setIsSubmitting(true);

    try {
      const createdRequest = await onSubmit({ targetName, targetImage, requesterName });
      setTargetName("");
      setTargetImage(null);
      setValidationMessage(null);
      event.currentTarget.reset();
      onSuccess?.(createdRequest);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {requiresRequesterName ? (
        <label className="block">
          <span className="text-sm font-semibold text-stone-800">Seu nome</span>
          <input
            className="mt-2 w-full rounded-md border border-stone-300 px-4 py-3 text-base outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
            type="text"
            value={requesterName}
            onChange={(event) => onRequesterNameChange?.(event.target.value)}
            placeholder="Ex: Maria Silva"
            autoComplete="name"
            required
          />
        </label>
      ) : null}

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

      <label className="block">
        <span className="text-sm font-semibold text-stone-800">Foto do procurado</span>
        <input
          className="mt-2 w-full rounded-md border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-stone-900 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white focus:border-red-700 focus:ring-2 focus:ring-red-100"
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          onChange={handleImageChange}
        />
      </label>

      {validationMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {validationMessage}
        </p>
      ) : null}

      {imagePreviewUrl ? (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
          <img
            className="aspect-[4/3] w-full object-cover"
            src={imagePreviewUrl}
            alt={`Preview de ${targetName || "procurado"}`}
          />
        </div>
      ) : null}

      <button
        className="w-full rounded-md bg-red-700 px-4 py-3 font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
