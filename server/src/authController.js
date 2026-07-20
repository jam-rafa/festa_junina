export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  login = (request, response) => {
    response.json(this.authService.login(request.body));
  };
}
