import { ValidationError } from "./errors.js";

export const ARREST_REQUEST_PRICE_CENTS = 300;
export const ARREST_REQUEST_DURATION_MINUTES = 5;

const REQUEST_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

const PAYMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
};

function assertValidTargetName(targetName) {
  if (typeof targetName !== "string" || targetName.trim().length === 0) {
    throw new ValidationError("Nome da pessoa procurada é obrigatório");
  }
}

function assertPendingRequest(request) {
  if (request.status !== REQUEST_STATUS.PENDING) {
    throw new ValidationError("Apenas pedidos pendentes podem ser alterados");
  }
}

export class ArrestRequestService {
  constructor(arrestRequestRepository, queueService) {
    this.arrestRequestRepository = arrestRequestRepository;
    this.queueService = queueService;
  }

  createRequest({ targetName }) {
    assertValidTargetName(targetName);
    return this.arrestRequestRepository.create({
      targetName: targetName.trim(),
      status: REQUEST_STATUS.PENDING,
      priceCents: ARREST_REQUEST_PRICE_CENTS,
      durationMinutes: ARREST_REQUEST_DURATION_MINUTES,
      paymentStatus: PAYMENT_STATUS.PENDING,
      createdAt: new Date().toISOString(),
    });
  }

  listRequests() {
    return this.arrestRequestRepository.findAll();
  }

  confirmPayment(id) {
    const request = this.arrestRequestRepository.findById(id);
    assertPendingRequest(request);
    if (request.paymentStatus === PAYMENT_STATUS.CONFIRMED) {
      return request;
    }
    return this.arrestRequestRepository.confirmPayment(id, new Date().toISOString());
  }

  acceptRequest(id) {
    const request = this.arrestRequestRepository.findById(id);
    assertPendingRequest(request);
    if (request.paymentStatus !== PAYMENT_STATUS.CONFIRMED) {
      throw new ValidationError("Confirme o pagamento antes de prender");
    }

    const acceptedRequest = this.arrestRequestRepository.accept(id, new Date().toISOString());
    const queuedGuest = this.queueService.addGuest({
      guestName: acceptedRequest.targetName,
      holdDurationMinutes: acceptedRequest.durationMinutes,
    });

    return { request: acceptedRequest, queuedGuest };
  }

  rejectRequest(id) {
    const request = this.arrestRequestRepository.findById(id);
    assertPendingRequest(request);
    return this.arrestRequestRepository.reject(id, new Date().toISOString());
  }
}
