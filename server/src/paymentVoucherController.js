export class PaymentVoucherController {
  constructor(paymentVoucherService) {
    this.paymentVoucherService = paymentVoucherService;
  }

  createPaidVoucher = (request, response) => {
    const voucher = this.paymentVoucherService.createPaidVoucher(request.body?.maxUses);
    response.status(201).json(voucher);
  };

  validateVoucher = (request, response) => {
    response.json(this.paymentVoucherService.getVoucherStatus(request.body.code ?? ""));
  };
}
