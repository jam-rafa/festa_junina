import { ValidationError } from "./errors.js";

function assertValidGuestName(guestName) {
  if (typeof guestName !== "string" || guestName.trim().length === 0) {
    throw new ValidationError("Nome do convidado é obrigatório");
  }
}

function assertValidHoldDuration(holdDurationMinutes) {
  if (!Number.isFinite(holdDurationMinutes) || holdDurationMinutes <= 0) {
    throw new ValidationError("Tempo de espera deve ser um número maior que zero");
  }
}

function assertValidEntry({ guestName, holdDurationMinutes }) {
  assertValidGuestName(guestName);
  assertValidHoldDuration(holdDurationMinutes);
}

function normalizeTargetImagePath(targetImagePath) {
  if (typeof targetImagePath !== "string" || targetImagePath.trim().length === 0) {
    return null;
  }

  return targetImagePath.trim();
}

function calculateReleaseAtMs(guest) {
  return new Date(guest.enteredAt).getTime() + guest.holdDurationMinutes * 60_000;
}

function byReleaseTimeAscending(guestA, guestB) {
  return calculateReleaseAtMs(guestA) - calculateReleaseAtMs(guestB);
}

export class QueueService {
  constructor(queueRepository) {
    this.queueRepository = queueRepository;
  }

  addGuest({ guestName, targetImagePath, holdDurationMinutes }) {
    assertValidEntry({ guestName, holdDurationMinutes });
    return this.queueRepository.create({
      guestName: guestName.trim(),
      targetImagePath: normalizeTargetImagePath(targetImagePath),
      holdDurationMinutes,
      enteredAt: new Date().toISOString(),
    });
  }

  listGuests() {
    return this.queueRepository.findAll().sort(byReleaseTimeAscending);
  }

  updateGuest(id, { guestName, holdDurationMinutes }) {
    assertValidEntry({ guestName, holdDurationMinutes });
    return this.queueRepository.update(id, {
      guestName: guestName.trim(),
      holdDurationMinutes,
    });
  }

  removeGuest(id) {
    this.queueRepository.remove(id);
  }
}
