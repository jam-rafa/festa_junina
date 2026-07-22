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
}
