import { NotFoundError, ValidationError } from "./errors.js";

export class PaymentVoucherRepository {
  constructor(database) {
    this.database = database;
  }

  create({ code, maxUses, createdAt, expiresAt }) {
    const result = this.database
      .prepare(
        "INSERT INTO payment_vouchers (code, maxUses, createdAt, expiresAt) VALUES (?, ?, ?, ?)"
      )
      .run(code, maxUses, createdAt, expiresAt);
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

  findValidByCode(code) {
    return this.database
      .prepare(
        `SELECT * FROM payment_vouchers
         WHERE code = ? AND redeemedCount < maxUses`
      )
      .get(code);
  }

  redeem(code, now, createRequest) {
    const redeemVoucher = this.database.transaction(() => {
      const voucher = this.findValidByCode(code);
      if (!voucher) {
        throw new ValidationError("Este vale é inválido ou já atingiu o limite de registros");
      }

      const request = createRequest();
      this.database
        .prepare(
          `UPDATE payment_vouchers
           SET redeemedCount = redeemedCount + 1,
               usedAt = CASE WHEN redeemedCount + 1 >= maxUses THEN ? ELSE usedAt END,
               arrestRequestId = ?
           WHERE id = ?`
        )
        .run(now, request.id, voucher.id);
      return { ...request, remainingUses: voucher.maxUses - voucher.redeemedCount - 1 };
    });

    return redeemVoucher();
  }
}
