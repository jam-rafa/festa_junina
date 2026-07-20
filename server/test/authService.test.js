import test from "node:test";
import assert from "node:assert/strict";

import { AuthService } from "../src/authService.js";
import { ValidationError } from "../src/errors.js";

test("gera JWT para PIN administrativo válido", () => {
  const authService = new AuthService({
    adminPin: "2468",
    jwtSecret: "test-secret",
    tokenExpiresIn: "1h",
  });

  const { token } = authService.login({ pin: "2468" });
  const payload = authService.verifyToken(token);

  assert.equal(payload.role, "admin");
  assert.equal(payload.sub, "admin");
});

test("rejeita PIN administrativo inválido", () => {
  const authService = new AuthService({ adminPin: "2468", jwtSecret: "test-secret" });

  assert.throws(() => authService.login({ pin: "0000" }), ValidationError);
});
