import test from "node:test";
import assert from "node:assert/strict";

import { openDatabase } from "../src/db.js";
import { ValidationError } from "../src/errors.js";
import { EventSettingsRepository } from "../src/eventSettingsRepository.js";
import { EventSettingsService } from "../src/eventSettingsService.js";
import { DEFAULT_EVENT_SCREEN_BANNER_ID } from "../src/eventScreenBanners.js";

function createEventSettingsService() {
  const database = openDatabase(":memory:");
  return new EventSettingsService(new EventSettingsRepository(database));
}

test("retorna o banner padrao quando nao ha configuracao salva", () => {
  const eventSettingsService = createEventSettingsService();

  assert.deepEqual(eventSettingsService.getScreenBanner(), {
    bannerId: DEFAULT_EVENT_SCREEN_BANNER_ID,
  });
});

test("salva um banner valido", () => {
  const eventSettingsService = createEventSettingsService();

  const updatedBanner = eventSettingsService.updateScreenBanner({
    bannerId: "listagem",
  });

  assert.deepEqual(updatedBanner, {
    bannerId: "listagem",
  });
  assert.deepEqual(eventSettingsService.getScreenBanner(), {
    bannerId: "listagem",
  });
});

test("rejeita banner invalido", () => {
  const eventSettingsService = createEventSettingsService();

  assert.throws(
    () => eventSettingsService.updateScreenBanner({ bannerId: "Banner Invalido!" }),
    ValidationError
  );
});
