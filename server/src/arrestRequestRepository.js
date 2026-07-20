import { NotFoundError } from "./errors.js";

export class ArrestRequestRepository {
  constructor(database) {
    this.database = database;
  }

  create({ targetName, status, priceCents, durationMinutes, paymentStatus, createdAt }) {
    const result = this.database
      .prepare(
        `INSERT INTO arrest_requests
          (targetName, status, priceCents, durationMinutes, paymentStatus, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(targetName, status, priceCents, durationMinutes, paymentStatus, createdAt);
    return this.findById(result.lastInsertRowid);
  }

  findAll() {
    return this.database
      .prepare("SELECT * FROM arrest_requests ORDER BY createdAt ASC")
      .all();
  }

  findById(id) {
    const request = this.database
      .prepare("SELECT * FROM arrest_requests WHERE id = ?")
      .get(id);
    if (!request) {
      throw new NotFoundError(`Pedido de prisão ${id} não encontrado`);
    }
    return request;
  }

  confirmPayment(id, paidAt) {
    this.findById(id);
    this.database
      .prepare("UPDATE arrest_requests SET paymentStatus = ?, paidAt = ? WHERE id = ?")
      .run("confirmed", paidAt, id);
    return this.findById(id);
  }

  accept(id, acceptedAt) {
    this.findById(id);
    this.database
      .prepare("UPDATE arrest_requests SET status = ?, acceptedAt = ? WHERE id = ?")
      .run("accepted", acceptedAt, id);
    return this.findById(id);
  }

  reject(id, rejectedAt) {
    this.findById(id);
    this.database
      .prepare("UPDATE arrest_requests SET status = ?, rejectedAt = ? WHERE id = ?")
      .run("rejected", rejectedAt, id);
    return this.findById(id);
  }
}
