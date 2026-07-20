export class QueueController {
  constructor(queueService, realtimeGateway) {
    this.queueService = queueService;
    this.realtimeGateway = realtimeGateway;
  }

  listGuests = (request, response) => {
    response.json(this.queueService.listGuests());
  };

  addGuest = (request, response) => {
    const createdGuest = this.queueService.addGuest(request.body);
    this.broadcastCurrentQueue();
    response.status(201).json(createdGuest);
  };

  updateGuest = (request, response) => {
    const guestId = Number(request.params.id);
    const updatedGuest = this.queueService.updateGuest(guestId, request.body);
    this.broadcastCurrentQueue();
    response.json(updatedGuest);
  };

  removeGuest = (request, response) => {
    const guestId = Number(request.params.id);
    this.queueService.removeGuest(guestId);
    this.broadcastCurrentQueue();
    response.status(204).send();
  };

  broadcastCurrentQueue() {
    this.realtimeGateway.broadcastQueueUpdated(this.queueService.listGuests());
  }
}
