import { Router } from "express";
import { requireAdmin } from "./authMiddleware.js";

export function createApiRouter(
  queueController,
  arrestRequestController,
  authController,
  eventSettingsController,
  authService
) {
  const router = Router();
  const adminOnly = requireAdmin(authService);

  router.get("/queue", queueController.listGuests);
  router.post("/auth/admin/login", authController.login);
  router.post("/arrest-requests", arrestRequestController.createRequest);
  router.get("/event-screen/banner", eventSettingsController.getScreenBanner);

  router.get("/arrest-requests", adminOnly, arrestRequestController.listRequests);
  router.post("/queue", adminOnly, queueController.addGuest);
  router.put("/queue/:id", adminOnly, queueController.updateGuest);
  router.delete("/queue/:id", adminOnly, queueController.removeGuest);
  router.put("/event-screen/banner", adminOnly, eventSettingsController.updateScreenBanner);
  router.post("/arrest-requests/:id/confirm-payment", adminOnly, arrestRequestController.confirmPayment);
  router.post("/arrest-requests/:id/accept", adminOnly, arrestRequestController.acceptRequest);
  router.post("/arrest-requests/:id/reject", adminOnly, arrestRequestController.rejectRequest);

  return router;
}
