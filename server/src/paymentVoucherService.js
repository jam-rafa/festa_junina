import crypto from "node:crypto";

const VOUCHER_DURATION_MINUTES = 15;
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function formatVoucherCode(value) {
  return typeof value === "string"
    ? value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
    : "";
}

function createVoucherCode() {
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

export class PaymentVoucherService {
  constructor(paymentVoucherRepository) {
    this.paymentVoucherRepository = paymentVoucherRepository;
  }

  createPaidVoucher() {
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + VOUCHER_DURATION_MINUTES * 60 * 1000);

    return this.paymentVoucherRepository.create({
      code: createVoucherCode(),
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
  }

  validateVoucher(code) {
    return Boolean(this.paymentVoucherRepository.findValidByCode(formatVoucherCode(code), new Date().toISOString()));
  }

  redeemVoucher(code, createRequest) {
    return this.paymentVoucherRepository.redeem(
      formatVoucherCode(code),
      new Date().toISOString(),
      createRequest
    );
  }
}
