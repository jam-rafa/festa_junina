import { ValidationError } from "./errors.js";
import crypto from "node:crypto";
import {
  DEFAULT_EVENT_SCREEN_BANNER_ID,
  EVENT_SCREEN_BANNER_ID_PATTERN,
} from "./eventScreenBanners.js";

const EVENT_SCREEN_BANNER_KEY = "event_screen_banner";

export class EventSettingsService {
  constructor(eventSettingsRepository, eventScreenBannerRepository) {
    this.eventSettingsRepository = eventSettingsRepository;
    this.eventScreenBannerRepository = eventScreenBannerRepository;
  }

  getScreenBanner() {
    const storedBannerId =
      this.eventSettingsRepository.findValue(EVENT_SCREEN_BANNER_KEY) ??
      DEFAULT_EVENT_SCREEN_BANNER_ID;
    const bannerId = EVENT_SCREEN_BANNER_ID_PATTERN.test(storedBannerId)
      ? storedBannerId
      : DEFAULT_EVENT_SCREEN_BANNER_ID;

    return { bannerId };
  }

  updateScreenBanner({ bannerId }) {
    if (!EVENT_SCREEN_BANNER_ID_PATTERN.test(bannerId) || !this.isKnownBanner(bannerId)) {
      throw new ValidationError("Banner do telão inválido");
    }

    this.eventSettingsRepository.saveValue(EVENT_SCREEN_BANNER_KEY, bannerId);

    return { bannerId };
  }

  listCustomScreenBanners() { return this.eventScreenBannerRepository.findAll(); }

  createCustomScreenBanner({ label, imagePath }) {
    if (!imagePath?.startsWith("/uploads/event-screen-banners/")) throw new ValidationError("Envie uma imagem para o banner");
    return this.eventScreenBannerRepository.create({
      id: `personalizado-${crypto.randomUUID()}`,
      label: String(label || "Banner do telão").trim().slice(0, 60) || "Banner do telão",
      imagePath, createdAt: new Date().toISOString(),
    });
  }

  deleteCustomScreenBanner(id) {
    const banner = this.eventScreenBannerRepository.delete(id);
    if (this.getScreenBanner().bannerId === id) this.eventSettingsRepository.saveValue(EVENT_SCREEN_BANNER_KEY, DEFAULT_EVENT_SCREEN_BANNER_ID);
    return banner;
  }

  isKnownBanner(id) {
    if ([DEFAULT_EVENT_SCREEN_BANNER_ID, "listagem"].includes(id)) return true;
    try { this.eventScreenBannerRepository.findById(id); return true; } catch { return false; }
  }
}
