import { UnauthorizedError } from "./errors.js";

export function requireAdmin(authService) {
  return (request, response, next) => {
    const authorizationHeader = request.get("authorization") ?? "";
    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      next(new UnauthorizedError("Acesso administrativo requer autenticação"));
      return;
    }

    try {
      request.admin = authService.verifyToken(token);
      next();
    } catch {
      next(new UnauthorizedError("Sessão administrativa inválida ou expirada"));
    }
  };
}
