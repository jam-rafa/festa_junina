import { NotFoundError, ValidationError } from "./errors.js";

export class PaymentVoucherRepository {
  constructor(database) {
    this.database = database;
  }

  create({ code, createdAt, expiresAt }) {
    const result = this.database
      .prepare(
        "INSERT INTO payment_vouchers (code, createdAt, expiresAt) VALUES (?, ?, ?)"
      )
      .run(code, createdAt, expiresAt);
    return this.findById(result.lastInsertRowid);
  }

  findById(id) {
    const voucher = this.database
      .prepare("SELECT * FROM payment_vouchers WHERE id = ?")
      .get(id);

    if (!voucher) {
      throw new NotFoundError("Vale de pagamento não encontrado");
    }

    return voucher;
  }

  findValidByCode(code, now) {
    return this.database
      .prepare(
        `SELECT * FROM payment_vouchers
         WHERE code = ? AND usedAt IS NULL AND expiresAt > ?`
      )
      .get(code, now);
  }

  redeem(code, now, createRequest) {
    const redeemVoucher = this.database.transaction(() => {
      const voucher = this.findValidByCode(code, now);
      if (!voucher) {
        throw new ValidationError("Este vale é inválido, já foi usado ou expirou");
      }

      const request = createRequest();
      this.database
        .prepare("UPDATE payment_vouchers SET usedAt = ?, arrestRequestId = ? WHERE id = ?")
        .run(now, request.id, voucher.id);
      return request;
    });

    return redeemVoucher();
  }
}
