import { Router } from "express";
import { requireAdmin } from "./authMiddleware.js";
import { attachUploadedImagePath, uploadArrestRequestImage } from "./uploadMiddleware.js";

export function createApiRouter(
  queueController,
  arrestRequestController,
  authController,
  eventSettingsController,
  authService,
  paymentVoucherController
) {
  const router = Router();
  const adminOnly = requireAdmin(authService);

  router.get("/queue", queueController.listGuests);
  router.post("/auth/admin/login", authController.login);
  router.post(
    "/arrest-requests",
    uploadArrestRequestImage,
    attachUploadedImagePath,
    arrestRequestController.createRequest
  );
  router.post("/payment-vouchers/validate", paymentVoucherController.validateVoucher);
  router.get("/event-screen/banner", eventSettingsController.getScreenBanner);

  router.get("/arrest-requests", adminOnly, arrestRequestController.listRequests);
  router.post(
    "/arrest-requests/admin",
    adminOnly,
    uploadArrestRequestImage,
    attachUploadedImagePath,
    arrestRequestController.createAdminRequest
  );
  router.post("/queue", adminOnly, queueController.addGuest);
  router.post("/payment-vouchers", adminOnly, paymentVoucherController.createPaidVoucher);
  router.put("/queue/:id", adminOnly, queueController.updateGuest);
  router.delete("/queue/:id", adminOnly, queueController.removeGuest);
  router.put("/event-screen/banner", adminOnly, eventSettingsController.updateScreenBanner);
  router.post("/arrest-requests/:id/confirm-payment", adminOnly, arrestRequestController.confirmPayment);
  router.post("/arrest-requests/:id/reuse-image", adminOnly, arrestRequestController.reuseImage);
  router.post("/arrest-requests/:id/accept", adminOnly, arrestRequestController.acceptRequest);
  router.post("/arrest-requests/:id/reject", adminOnly, arrestRequestController.rejectRequest);

  return router;
}
