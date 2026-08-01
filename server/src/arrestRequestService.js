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

function normalizeTargetImagePath(targetImagePath) {
  if (typeof targetImagePath !== "string" || targetImagePath.trim().length === 0) {
    return null;
  }

  return targetImagePath.trim();
}

function normalizeComparableName(name) {
  return name
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function assertPendingRequest(request) {
  if (request.status !== REQUEST_STATUS.PENDING) {
    throw new ValidationError("Apenas pedidos pendentes podem ser alterados");
  }
}

export class ArrestRequestService {
  constructor(arrestRequestRepository, queueService, paymentVoucherService = null) {
    this.arrestRequestRepository = arrestRequestRepository;
    this.queueService = queueService;
    this.paymentVoucherService = paymentVoucherService;
  }

  createRequest({ targetName, targetImagePath }) {
    assertValidTargetName(targetName);
    return this.arrestRequestRepository.create({
      targetName: targetName.trim(),
      targetImagePath: normalizeTargetImagePath(targetImagePath),
      status: REQUEST_STATUS.PENDING,
      priceCents: ARREST_REQUEST_PRICE_CENTS,
      durationMinutes: ARREST_REQUEST_DURATION_MINUTES,
      paymentStatus: PAYMENT_STATUS.PENDING,
      createdAt: new Date().toISOString(),
    });
  }

  createPaidRequest({ targetName, targetImagePath, voucherCode }) {
    assertValidTargetName(targetName);
    if (!this.paymentVoucherService) {
      throw new ValidationError("Os vales de pagamento não estão disponíveis");
    }

    return this.paymentVoucherService.redeemVoucher(voucherCode ?? "", () =>
      this.arrestRequestRepository.create({
        targetName: targetName.trim(),
        targetImagePath: normalizeTargetImagePath(targetImagePath),
        status: REQUEST_STATUS.PENDING,
        priceCents: ARREST_REQUEST_PRICE_CENTS,
        durationMinutes: ARREST_REQUEST_DURATION_MINUTES,
        paymentStatus: PAYMENT_STATUS.CONFIRMED,
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
      })
    );
  }

  createAdminPaidRequest({ targetName, targetImagePath }) {
    assertValidTargetName(targetName);
    const paidAt = new Date().toISOString();

    return this.arrestRequestRepository.create({
      targetName: targetName.trim(),
      targetImagePath: normalizeTargetImagePath(targetImagePath),
      status: REQUEST_STATUS.PENDING,
      priceCents: ARREST_REQUEST_PRICE_CENTS,
      durationMinutes: ARREST_REQUEST_DURATION_MINUTES,
      paymentStatus: PAYMENT_STATUS.CONFIRMED,
      createdAt: paidAt,
      paidAt,
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

  reuseImageFromRequest(id, sourceRequestId) {
    const request = this.arrestRequestRepository.findById(id);
    assertPendingRequest(request);

    if (request.targetImagePath) {
      throw new ValidationError("Este pedido já tem foto");
    }

    const sourceRequest = this.arrestRequestRepository.findById(sourceRequestId);
    if (!sourceRequest.targetImagePath) {
      throw new ValidationError("O pedido escolhido não tem foto para reutilizar");
    }

    if (
      normalizeComparableName(sourceRequest.targetName) !==
      normalizeComparableName(request.targetName)
    ) {
      throw new ValidationError("A foto anterior precisa ser da mesma pessoa");
    }

    return this.arrestRequestRepository.updateTargetImagePath(id, sourceRequest.targetImagePath);
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
      targetImagePath: acceptedRequest.targetImagePath,
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
