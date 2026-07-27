export function handleRequestErrors(error, request, response, next) {
  if (error.code === "LIMIT_FILE_SIZE") {
    response.status(400).json({ message: "A imagem deve ter no máximo 3MB" });
    return;
  }

  const statusCode = error.statusCode ?? 500;
  response.status(statusCode).json({ message: error.message });
}
