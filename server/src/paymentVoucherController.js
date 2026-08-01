export class PaymentVoucherController {
  constructor(paymentVoucherService) {
    this.paymentVoucherService = paymentVoucherService;
  }

  createPaidVoucher = (_request, response) => {
    const voucher = this.paymentVoucherService.createPaidVoucher();
    response.status(201).json(voucher);
  };

  validateVoucher = (request, response) => {
    const isValid = this.paymentVoucherService.validateVoucher(request.body.code ?? "");
    response.json({ isValid });
  };
}
