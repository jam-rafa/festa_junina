const QUEUE_UPDATED_EVENT = "queue:updated";

export class RealtimeGateway {
  constructor(socketIoServer) {
    this.socketIoServer = socketIoServer;
  }

  broadcastQueueUpdated(guests) {
    this.socketIoServer.emit(QUEUE_UPDATED_EVENT, guests);
  }
}
