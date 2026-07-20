import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server as SocketIoServer } from "socket.io";

import { openDatabase } from "./db.js";
import { QueueRepository } from "./queueRepository.js";
import { QueueService } from "./queueService.js";
import { RealtimeGateway } from "./realtimeGateway.js";
import { QueueController } from "./queueController.js";
import { createQueueRouter } from "./routes.js";
import { handleRequestErrors } from "./errorHandler.js";

const PORT = process.env.PORT ?? 3000;

function createApp(queueController) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api", createQueueRouter(queueController));
  app.use(handleRequestErrors);
  return app;
}

function startServer() {
  const database = openDatabase();
  const queueService = new QueueService(new QueueRepository(database));

  const socketIoServer = new SocketIoServer({ cors: { origin: "*" } });
  const realtimeGateway = new RealtimeGateway(socketIoServer);

  const queueController = new QueueController(queueService, realtimeGateway);
  const httpServer = createServer(createApp(queueController));
  socketIoServer.attach(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Servidor da fila rodando na porta ${PORT}`);
  });
}

startServer();
