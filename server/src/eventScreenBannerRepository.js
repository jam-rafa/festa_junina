import { NotFoundError } from "./errors.js";

export class EventScreenBannerRepository {
  constructor(database) {
    this.database = database;
  }

  create({ id, label, imagePath, createdAt }) {
    this.database
      .prepare(
        "INSERT INTO event_screen_banners (id, label, imagePath, createdAt) VALUES (?, ?, ?, ?)"
      )
      .run(id, label, imagePath, createdAt);
    return this.findById(id);
  }

  findAll() {
    return this.database
      .prepare("SELECT * FROM event_screen_banners ORDER BY createdAt DESC")
      .all();
  }

  findById(id) {
    const banner = this.database
      .prepare("SELECT * FROM event_screen_banners WHERE id = ?")
      .get(id);
    if (!banner) {
      throw new NotFoundError("Banner não encontrado");
    }
    return banner;
  }

  delete(id) {
    const banner = this.findById(id);
    this.database.prepare("DELETE FROM event_screen_banners WHERE id = ?").run(id);
    return banner;
  }
}
