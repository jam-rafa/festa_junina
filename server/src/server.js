import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server as SocketIoServer } from "socket.io";

import { uploadStoragePath } from "./uploadStorage.js";
import { openDatabase } from "./db.js";
import { QueueRepository } from "./queueRepository.js";
import { QueueService } from "./queueService.js";
import { ArrestRequestRepository } from "./arrestRequestRepository.js";
import { ArrestRequestService } from "./arrestRequestService.js";
import { PaymentVoucherRepository } from "./paymentVoucherRepository.js";
import { PaymentVoucherService } from "./paymentVoucherService.js";
import { PaymentVoucherController } from "./paymentVoucherController.js";
import { RealtimeGateway } from "./realtimeGateway.js";
import { QueueController } from "./queueController.js";
import { ArrestRequestController } from "./arrestRequestController.js";
import { AuthController } from "./authController.js";
import { AuthService } from "./authService.js";
import { EventSettingsRepository } from "./eventSettingsRepository.js";
import { EventSettingsService } from "./eventSettingsService.js";
import { EventSettingsController } from "./eventSettingsController.js";
import { createApiRouter } from "./routes.js";
import { handleRequestErrors } from "./errorHandler.js";

const PORT = process.env.PORT ?? 3000;

function createApp(
  queueController,
  arrestRequestController,
  authController,
  eventSettingsController,
  authService,
  paymentVoucherController
) {
  const app = express();
  app.use(cors());
  app.get("/healthz", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });
  app.use("/uploads", express.static(uploadStoragePath));
  app.use(express.json());
  app.use(
    "/api",
    createApiRouter(
      queueController,
      arrestRequestController,
      authController,
      eventSettingsController,
      authService,
      paymentVoucherController
    )
  );
  app.use(handleRequestErrors);
  return app;
}

function startServer() {
  const database = openDatabase();
  const queueService = new QueueService(new QueueRepository(database));
  const paymentVoucherService = new PaymentVoucherService(new PaymentVoucherRepository(database));
  const arrestRequestService = new ArrestRequestService(
    new ArrestRequestRepository(database),
    queueService,
    paymentVoucherService
  );
  const eventSettingsService = new EventSettingsService(new EventSettingsRepository(database));

  const socketIoServer = new SocketIoServer({ cors: { origin: "*" } });
  const authService = new AuthService();
  const realtimeGateway = new RealtimeGateway(socketIoServer, authService);

  const queueController = new QueueController(queueService, realtimeGateway);
  const authController = new AuthController(authService);
  const eventSettingsController = new EventSettingsController(eventSettingsService, realtimeGateway);
  const paymentVoucherController = new PaymentVoucherController(paymentVoucherService);
  const arrestRequestController = new ArrestRequestController(
    arrestRequestService,
    queueService,
    realtimeGateway
  );
  const httpServer = createServer(
    createApp(
      queueController,
      arrestRequestController,
      authController,
      eventSettingsController,
      authService,
      paymentVoucherController
    )
  );
  socketIoServer.attach(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Servidor da fila rodando na porta ${PORT}`);
  });
}

startServer();
