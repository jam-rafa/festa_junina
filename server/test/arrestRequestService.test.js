import test from "node:test";
import assert from "node:assert/strict";

import { openDatabase } from "../src/db.js";
import { ArrestRequestRepository } from "../src/arrestRequestRepository.js";
import {
  ARREST_REQUEST_DURATION_MINUTES,
  ARREST_REQUEST_PRICE_CENTS,
  ArrestRequestService,
} from "../src/arrestRequestService.js";
import { QueueRepository } from "../src/queueRepository.js";
import { QueueService } from "../src/queueService.js";
import { ValidationError } from "../src/errors.js";

function createServices() {
  const database = openDatabase(":memory:");
  const queueService = new QueueService(new QueueRepository(database));
  const arrestRequestService = new ArrestRequestService(
    new ArrestRequestRepository(database),
    queueService
  );
  return { arrestRequestService, queueService };
}

test("cria um pedido de prisão válido com pagamento pendente", () => {
  const { arrestRequestService } = createServices();

  const request = arrestRequestService.createRequest({ targetName: "João" });

  assert.equal(request.targetName, "João");
  assert.equal(request.status, "pending");
  assert.equal(request.paymentStatus, "pending");
  assert.equal(request.priceCents, ARREST_REQUEST_PRICE_CENTS);
  assert.equal(request.durationMinutes, ARREST_REQUEST_DURATION_MINUTES);
});

test("rejeita pedido de prisão sem nome do alvo", () => {
  const { arrestRequestService } = createServices();

  assert.throws(() => arrestRequestService.createRequest({ targetName: "  " }), ValidationError);
});

test("confirma pagamento manual de um pedido pendente", () => {
  const { arrestRequestService } = createServices();
  const request = arrestRequestService.createRequest({ targetName: "Maria" });

  const paidRequest = arrestRequestService.confirmPayment(request.id);

  assert.equal(paidRequest.paymentStatus, "confirmed");
  assert.ok(paidRequest.paidAt);
});

test("impede aceitar pedido sem pagamento confirmado", () => {
  const { arrestRequestService } = createServices();
  const request = arrestRequestService.createRequest({ targetName: "Carlos" });

  assert.throws(() => arrestRequestService.acceptRequest(request.id), ValidationError);
});

test("aceita pedido pago e cria preso com duração padrão", () => {
  const { arrestRequestService, queueService } = createServices();
  const request = arrestRequestService.createRequest({ targetName: "Ana" });
  arrestRequestService.confirmPayment(request.id);

  const result = arrestRequestService.acceptRequest(request.id);
  const guests = queueService.listGuests();

  assert.equal(result.request.status, "accepted");
  assert.equal(result.queuedGuest.guestName, "Ana");
  assert.equal(result.queuedGuest.holdDurationMinutes, ARREST_REQUEST_DURATION_MINUTES);
  assert.equal(guests.length, 1);
  assert.equal(guests[0].guestName, "Ana");
});

test("recusa pedido pendente", () => {
  const { arrestRequestService } = createServices();
  const request = arrestRequestService.createRequest({ targetName: "Bruno" });

  const rejectedRequest = arrestRequestService.rejectRequest(request.id);

  assert.equal(rejectedRequest.status, "rejected");
  assert.ok(rejectedRequest.rejectedAt);
});

test("impede alterar pedido já aceito", () => {
  const { arrestRequestService } = createServices();
  const request = arrestRequestService.createRequest({ targetName: "Duda" });
  arrestRequestService.confirmPayment(request.id);
  arrestRequestService.acceptRequest(request.id);

  assert.throws(() => arrestRequestService.rejectRequest(request.id), ValidationError);
});
