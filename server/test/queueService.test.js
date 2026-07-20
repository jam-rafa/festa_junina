import test from "node:test";
import assert from "node:assert/strict";

import { openDatabase } from "../src/db.js";
import { QueueRepository } from "../src/queueRepository.js";
import { QueueService } from "../src/queueService.js";
import { ValidationError, NotFoundError } from "../src/errors.js";

function createQueueService() {
  const database = openDatabase(":memory:");
  return new QueueService(new QueueRepository(database));
}

test("adiciona um convidado válido à fila", () => {
  const queueService = createQueueService();

  const guest = queueService.addGuest({ guestName: "Maria", holdDurationMinutes: 15 });

  assert.equal(guest.guestName, "Maria");
  assert.equal(guest.holdDurationMinutes, 15);
});

test("lista convidados ordenados por tempo restante, não por ordem de chegada", () => {
  const queueService = createQueueService();
  queueService.addGuest({ guestName: "Ana", holdDurationMinutes: 20 });
  queueService.addGuest({ guestName: "Bruno", holdDurationMinutes: 5 });

  const guests = queueService.listGuests();

  assert.equal(guests.length, 2);
  assert.equal(guests[0].guestName, "Bruno");
  assert.equal(guests[1].guestName, "Ana");
});

test("rejeita nome vazio", () => {
  const queueService = createQueueService();

  assert.throws(
    () => queueService.addGuest({ guestName: "  ", holdDurationMinutes: 10 }),
    ValidationError
  );
});

test("rejeita tempo de espera não positivo", () => {
  const queueService = createQueueService();

  assert.throws(
    () => queueService.addGuest({ guestName: "Carlos", holdDurationMinutes: 0 }),
    ValidationError
  );
});

test("atualiza um convidado existente", () => {
  const queueService = createQueueService();
  const guest = queueService.addGuest({ guestName: "Duda", holdDurationMinutes: 10 });

  const updatedGuest = queueService.updateGuest(guest.id, {
    guestName: "Duda Silva",
    holdDurationMinutes: 25,
  });

  assert.equal(updatedGuest.guestName, "Duda Silva");
  assert.equal(updatedGuest.holdDurationMinutes, 25);
});

test("lança erro ao atualizar convidado inexistente", () => {
  const queueService = createQueueService();

  assert.throws(
    () => queueService.updateGuest(999, { guestName: "Fantasma", holdDurationMinutes: 5 }),
    NotFoundError
  );
});

test("remove um convidado existente", () => {
  const queueService = createQueueService();
  const guest = queueService.addGuest({ guestName: "Eva", holdDurationMinutes: 10 });

  queueService.removeGuest(guest.id);

  assert.deepEqual(queueService.listGuests(), []);
});

test("lança erro ao remover convidado inexistente", () => {
  const queueService = createQueueService();

  assert.throws(() => queueService.removeGuest(999), NotFoundError);
});
