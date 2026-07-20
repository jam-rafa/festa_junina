const QUEUE_UPDATED_EVENT = "queue:updated";
const ARREST_REQUESTS_UPDATED_EVENT = "arrest-requests:updated";
const ADMIN_ROOM = "admin";

export class RealtimeGateway {
  constructor(socketIoServer, authService) {
    this.socketIoServer = socketIoServer;
    this.authService = authService;
    this.registerAdminSockets();
  }

  broadcastQueueUpdated(guests) {
    this.socketIoServer.emit(QUEUE_UPDATED_EVENT, guests);
  }

  broadcastArrestRequestsUpdated(requests) {
    this.socketIoServer.to(ADMIN_ROOM).emit(ARREST_REQUESTS_UPDATED_EVENT, requests);
  }

  registerAdminSockets() {
    this.socketIoServer.on("connection", (socket) => {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return;
      }

      try {
        this.authService.verifyToken(token);
        socket.join(ADMIN_ROOM);
      } catch {
        socket.disconnect();
      }
    });
  }
}
