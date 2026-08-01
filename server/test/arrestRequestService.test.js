import test from "node:test";
import assert from "node:assert/strict";

import { openDatabase } from "../src/db.js";
import { ArrestRequestRepository } from "../src/arrestRequestRepository.js";
import { PaymentVoucherRepository } from "../src/paymentVoucherRepository.js";
import { PaymentVoucherService } from "../src/paymentVoucherService.js";
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
  const paymentVoucherService = new PaymentVoucherService(new PaymentVoucherRepository(database));
  const arrestRequestService = new ArrestRequestService(
    new ArrestRequestRepository(database),
    queueService,
    paymentVoucherService
  );
  return { arrestRequestService, paymentVoucherService, queueService };
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

test("mantém imagem do pedido quando cria o preso", () => {
  const { arrestRequestService, queueService } = createServices();
  const request = arrestRequestService.createRequest({
    targetName: "Bia",
    targetImagePath: "/uploads/arrest-requests/bia.webp",
  });
  arrestRequestService.confirmPayment(request.id);

  const result = arrestRequestService.acceptRequest(request.id);
  const guests = queueService.listGuests();

  assert.equal(result.request.targetImagePath, "/uploads/arrest-requests/bia.webp");
  assert.equal(result.queuedGuest.targetImagePath, "/uploads/arrest-requests/bia.webp");
  assert.equal(guests[0].targetImagePath, "/uploads/arrest-requests/bia.webp");
});

test("reutiliza imagem anterior de pedido da mesma pessoa", () => {
  const { arrestRequestService } = createServices();
  const previousRequest = arrestRequestService.createRequest({
    targetName: "João da Silva",
    targetImagePath: "/uploads/arrest-requests/joao.webp",
  });
  const nextRequest = arrestRequestService.createRequest({ targetName: "Joao da Silva" });

  const updatedRequest = arrestRequestService.reuseImageFromRequest(
    nextRequest.id,
    previousRequest.id
  );

  assert.equal(updatedRequest.targetImagePath, "/uploads/arrest-requests/joao.webp");
});

test("impede reutilizar foto de outra pessoa", () => {
  const { arrestRequestService } = createServices();
  const previousRequest = arrestRequestService.createRequest({
    targetName: "Ana",
    targetImagePath: "/uploads/arrest-requests/ana.webp",
  });
  const nextRequest = arrestRequestService.createRequest({ targetName: "Bia" });

  assert.throws(
    () => arrestRequestService.reuseImageFromRequest(nextRequest.id, previousRequest.id),
    ValidationError
  );
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

test("cria pedido pago ao usar um vale de pagamento", () => {
  const { arrestRequestService, paymentVoucherService } = createServices();
  const voucher = paymentVoucherService.createPaidVoucher();

  const request = arrestRequestService.createPaidRequest({
    targetName: "Lia",
    voucherCode: voucher.code,
  });

  assert.equal(request.targetName, "Lia");
  assert.equal(request.paymentStatus, "confirmed");
  assert.ok(request.paidAt);
  assert.equal(paymentVoucherService.validateVoucher(voucher.code), false);
});

test("impede usar o mesmo vale mais de uma vez", () => {
  const { arrestRequestService, paymentVoucherService } = createServices();
  const voucher = paymentVoucherService.createPaidVoucher();
  arrestRequestService.createPaidRequest({ targetName: "Lia", voucherCode: voucher.code });

  assert.throws(
    () => arrestRequestService.createPaidRequest({ targetName: "Caio", voucherCode: voucher.code }),
    ValidationError
  );
});

test("adm pode cadastrar um pedido pago sem vale", () => {
  const { arrestRequestService } = createServices();

  const request = arrestRequestService.createAdminPaidRequest({ targetName: "No balcão" });

  assert.equal(request.paymentStatus, "confirmed");
  assert.ok(request.paidAt);
});
