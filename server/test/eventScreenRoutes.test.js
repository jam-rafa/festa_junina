import test from "node:test";
import assert from "node:assert/strict";

import { createApiRouter } from "../src/routes.js";
import { QueueController } from "../src/queueController.js";
import { ArrestRequestController } from "../src/arrestRequestController.js";
import { AuthController } from "../src/authController.js";
import { EventSettingsController } from "../src/eventSettingsController.js";
import { AuthService } from "../src/authService.js";
import { UnauthorizedError } from "../src/errors.js";

function createRouter() {
  const authService = new AuthService({ adminPin: "2468", jwtSecret: "test-secret" });
  const noop = () => {};

  return createApiRouter(
    new QueueController({ listGuests: noop, addGuest: noop, updateGuest: noop, removeGuest: noop }, {
      broadcastQueueUpdated: noop,
    }),
    new ArrestRequestController(
      {
        listRequests: noop,
        createRequest: noop,
        confirmPayment: noop,
        acceptRequest: noop,
        rejectRequest: noop,
      },
      { listGuests: noop },
      {
        broadcastArrestRequestsUpdated: noop,
        broadcastQueueUpdated: noop,
      }
    ),
    new AuthController(authService),
    new EventSettingsController(
      {
        getScreenBanner: () => ({ bannerId: "arraia-teste" }),
        updateScreenBanner: ({ bannerId }) => ({ bannerId }),
      },
      { broadcastEventScreenBannerUpdated: noop }
    ),
    authService
  );
}

function findRouteLayer(router, path, method) {
  return router.stack.find(
    (layer) => layer.route?.path === path && layer.route.methods?.[method] === true
  );
}

test("PUT /event-screen/banner aplica middleware de admin antes do controller", async () => {
  const router = createRouter();
  const routeLayer = findRouteLayer(router, "/event-screen/banner", "put");

  assert.ok(routeLayer);
  assert.equal(routeLayer.route.stack.length, 2);

  const adminMiddleware = routeLayer.route.stack[0].handle;
  const request = {
    get() {
      return "";
    },
  };

  await new Promise((resolve) => {
    adminMiddleware(request, {}, (error) => {
      assert.ok(error instanceof UnauthorizedError);
      assert.equal(error.message, "Acesso administrativo requer autenticação");
      resolve();
    });
  });
});
