import { NotFoundError } from "./errors.js";

export class QueueRepository {
  constructor(database) {
    this.database = database;
  }

  create({ guestName, holdDurationMinutes, enteredAt }) {
    const result = this.database
      .prepare(
        "INSERT INTO queue_entries (guestName, holdDurationMinutes, enteredAt) VALUES (?, ?, ?)"
      )
      .run(guestName, holdDurationMinutes, enteredAt);
    return this.findById(result.lastInsertRowid);
  }

  findAll() {
    return this.database
      .prepare("SELECT * FROM queue_entries ORDER BY enteredAt ASC")
      .all();
  }

  findById(id) {
    const entry = this.database
      .prepare("SELECT * FROM queue_entries WHERE id = ?")
      .get(id);
    if (!entry) {
      throw new NotFoundError(`Entrada de fila ${id} não encontrada`);
    }
    return entry;
  }

  update(id, { guestName, holdDurationMinutes }) {
    this.findById(id);
    this.database
      .prepare(
        "UPDATE queue_entries SET guestName = ?, holdDurationMinutes = ? WHERE id = ?"
      )
      .run(guestName, holdDurationMinutes, id);
    return this.findById(id);
  }

  remove(id) {
    this.findById(id);
    this.database.prepare("DELETE FROM queue_entries WHERE id = ?").run(id);
  }
}
