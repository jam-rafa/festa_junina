import { removeUploadedFile } from "./uploadStorage.js";

export class EventSettingsController {
  constructor(eventSettingsService, realtimeGateway) {
    this.eventSettingsService = eventSettingsService;
    this.realtimeGateway = realtimeGateway;
  }

  getScreenBanner = (request, response) => {
    response.json(this.eventSettingsService.getScreenBanner());
  };

  updateScreenBanner = (request, response) => {
    const updatedBanner = this.eventSettingsService.updateScreenBanner(request.body);
    this.realtimeGateway.broadcastEventScreenBannerUpdated(updatedBanner);
    response.json(updatedBanner);
  };

  listCustomScreenBanners = (_request, response) => response.json(this.eventSettingsService.listCustomScreenBanners());

  createCustomScreenBanner = (request, response) => {
    try {
      response.status(201).json(this.eventSettingsService.createCustomScreenBanner(request.body));
    } catch (error) {
      removeUploadedFile(request.file?.path);
      throw error;
    }
  };

  deleteCustomScreenBanner = (request, response) => {
    const banner = this.eventSettingsService.deleteCustomScreenBanner(request.params.id);
    this.realtimeGateway.broadcastEventScreenBannerUpdated(this.eventSettingsService.getScreenBanner());
    response.json(banner);
  };
}
