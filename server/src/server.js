import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server as SocketIoServer } from "socket.io";

import { openDatabase } from "./db.js";
import { QueueRepository } from "./queueRepository.js";
import { QueueService } from "./queueService.js";
import { ArrestRequestRepository } from "./arrestRequestRepository.js";
import { ArrestRequestService } from "./arrestRequestService.js";
import { RealtimeGateway } from "./realtimeGateway.js";
import { QueueController } from "./queueController.js";
import { ArrestRequestController } from "./arrestRequestController.js";
import { AuthController } from "./authController.js";
import { AuthService } from "./authService.js";
import { createApiRouter } from "./routes.js";
import { handleRequestErrors } from "./errorHandler.js";

const PORT = process.env.PORT ?? 3000;

function createApp(queueController, arrestRequestController, authController, authService) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api", createApiRouter(queueController, arrestRequestController, authController, authService));
  app.use(handleRequestErrors);
  return app;
}

function startServer() {
  const database = openDatabase();
  const queueService = new QueueService(new QueueRepository(database));
  const arrestRequestService = new ArrestRequestService(
    new ArrestRequestRepository(database),
    queueService
  );

  const socketIoServer = new SocketIoServer({ cors: { origin: "*" } });
  const authService = new AuthService();
  const realtimeGateway = new RealtimeGateway(socketIoServer, authService);

  const queueController = new QueueController(queueService, realtimeGateway);
  const authController = new AuthController(authService);
  const arrestRequestController = new ArrestRequestController(
    arrestRequestService,
    queueService,
    realtimeGateway
  );
  const httpServer = createServer(
    createApp(queueController, arrestRequestController, authController, authService)
  );
  socketIoServer.attach(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Servidor da fila rodando na porta ${PORT}`);
  });
}

startServer();
