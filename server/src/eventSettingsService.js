import { ValidationError } from "./errors.js";
import {
  DEFAULT_EVENT_SCREEN_BANNER_ID,
  EVENT_SCREEN_BANNER_ID_PATTERN,
} from "./eventScreenBanners.js";

const EVENT_SCREEN_BANNER_KEY = "event_screen_banner";

export class EventSettingsService {
  constructor(eventSettingsRepository) {
    this.eventSettingsRepository = eventSettingsRepository;
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
    if (!EVENT_SCREEN_BANNER_ID_PATTERN.test(bannerId)) {
      throw new ValidationError("Banner do telão inválido");
    }

    this.eventSettingsRepository.saveValue(EVENT_SCREEN_BANNER_KEY, bannerId);

    return { bannerId };
  }
}
