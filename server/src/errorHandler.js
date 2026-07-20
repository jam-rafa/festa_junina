export function handleRequestErrors(error, request, response, next) {
  const statusCode = error.statusCode ?? 500;
  response.status(statusCode).json({ message: error.message });
}
