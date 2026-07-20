import jwt from "jsonwebtoken";
import { ValidationError } from "./errors.js";

const DEFAULT_TOKEN_EXPIRES_IN = "12h";

export class AuthService {
  constructor({
    adminPin = process.env.ADMIN_PIN ?? "1234",
    jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-me",
    tokenExpiresIn = process.env.JWT_EXPIRES_IN ?? DEFAULT_TOKEN_EXPIRES_IN,
  } = {}) {
    this.adminPin = adminPin;
    this.jwtSecret = jwtSecret;
    this.tokenExpiresIn = tokenExpiresIn;
  }

  login({ pin }) {
    if (String(pin) !== String(this.adminPin)) {
      throw new ValidationError("PIN inválido");
    }

    return {
      token: jwt.sign({ role: "admin" }, this.jwtSecret, {
        subject: "admin",
        expiresIn: this.tokenExpiresIn,
      }),
    };
  }

  verifyToken(token) {
    return jwt.verify(token, this.jwtSecret);
  }
}
