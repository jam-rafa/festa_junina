import { Router } from "express";

export function createQueueRouter(queueController) {
  const router = Router();

  router.get("/queue", queueController.listGuests);
  router.post("/queue", queueController.addGuest);
  router.put("/queue/:id", queueController.updateGuest);
  router.delete("/queue/:id", queueController.removeGuest);

  return router;
}
