import { removeUploadedFile } from "./uploadStorage.js";

export class ArrestRequestController {
  constructor(arrestRequestService, queueService, realtimeGateway) {
    this.arrestRequestService = arrestRequestService;
    this.queueService = queueService;
    this.realtimeGateway = realtimeGateway;
  }

  listRequests = (request, response) => {
    response.json(this.arrestRequestService.listRequests());
  };

  createRequest = (request, response) => {
    try {
      const createdRequest = this.arrestRequestService.createPaidRequest(request.body);
      this.broadcastCurrentRequests();
      response.status(201).json(createdRequest);
    } catch (error) {
      removeUploadedFile(request.file?.path);
      throw error;
    }
  };

  createAdminRequest = (request, response) => {
    try {
      const createdRequest = this.arrestRequestService.createAdminPaidRequest(request.body);
      this.broadcastCurrentRequests();
      response.status(201).json(createdRequest);
    } catch (error) {
      removeUploadedFile(request.file?.path);
      throw error;
    }
  };

  confirmPayment = (request, response) => {
    const requestId = Number(request.params.id);
    const updatedRequest = this.arrestRequestService.confirmPayment(requestId);
    this.broadcastCurrentRequests();
    response.json(updatedRequest);
  };

  reuseImage = (request, response) => {
    const requestId = Number(request.params.id);
    const sourceRequestId = Number(request.body.sourceRequestId);
    const updatedRequest = this.arrestRequestService.reuseImageFromRequest(
      requestId,
      sourceRequestId
    );
    this.broadcastCurrentRequests();
    response.json(updatedRequest);
  };

  acceptRequest = (request, response) => {
    const requestId = Number(request.params.id);
    const result = this.arrestRequestService.acceptRequest(requestId);
    this.broadcastCurrentRequests();
    this.broadcastCurrentQueue();
    this.realtimeGateway.broadcastEventScreenArrestRequestAccepted(result.request);
    response.json(result);
  };

  rejectRequest = (request, response) => {
    const requestId = Number(request.params.id);
    const updatedRequest = this.arrestRequestService.rejectRequest(requestId);
    this.broadcastCurrentRequests();
    response.json(updatedRequest);
  };

  broadcastCurrentRequests() {
    this.realtimeGateway.broadcastArrestRequestsUpdated(this.arrestRequestService.listRequests());
  }

  broadcastCurrentQueue() {
    this.realtimeGateway.broadcastQueueUpdated(this.queueService.listGuests());
  }
}
