export class EventSettingsRepository {
  constructor(database) {
    this.database = database;
  }

  findValue(key) {
    const setting = this.database
      .prepare("SELECT value FROM event_settings WHERE key = ?")
      .get(key);

    return setting?.value ?? null;
  }

  saveValue(key, value) {
    this.database
      .prepare(
        `INSERT INTO event_settings (key, value)
         VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      )
      .run(key, value);

    return value;
  }
}
