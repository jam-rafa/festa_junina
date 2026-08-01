import crypto from "node:crypto";
import { ValidationError } from "./errors.js";

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

function normalizeMaxUses(maxUses) {
  const normalizedMaxUses = Number(maxUses ?? 1);
  if (!Number.isInteger(normalizedMaxUses) || normalizedMaxUses < 1 || normalizedMaxUses > 100) {
    throw new ValidationError("A quantidade de registros deve ser um número entre 1 e 100");
  }
  return normalizedMaxUses;
}

export class PaymentVoucherService {
  constructor(paymentVoucherRepository) {
    this.paymentVoucherRepository = paymentVoucherRepository;
  }

  createPaidVoucher(maxUses = 1) {
    const createdAt = new Date();

    return this.paymentVoucherRepository.create({
      code: createVoucherCode(),
      maxUses: normalizeMaxUses(maxUses),
      createdAt: createdAt.toISOString(),
      // Mantido para compatibilidade com bancos já existentes; não é usado para expirar o vale.
      expiresAt: createdAt.toISOString(),
    });
  }

  validateVoucher(code) {
    return Boolean(this.paymentVoucherRepository.findValidByCode(formatVoucherCode(code)));
  }

  getVoucherStatus(code) {
    const voucher = this.paymentVoucherRepository.findValidByCode(
      formatVoucherCode(code)
    );
    return {
      isValid: Boolean(voucher),
      remainingUses: voucher ? voucher.maxUses - voucher.redeemedCount : 0,
    };
  }

  redeemVoucher(code, createRequest) {
    return this.paymentVoucherRepository.redeem(
      formatVoucherCode(code),
      new Date().toISOString(),
      createRequest
    );
  }
}
