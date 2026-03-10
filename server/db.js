const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = process.env.DB_PATH || path.join(dataDir, 'inquiries.db');
const db = new Database(dbPath);

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      inquiry_type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);
}

function insertInquiry(data) {
  const stmt = db.prepare(`
    INSERT INTO inquiries (organization, contact_name, phone, email, inquiry_type, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.organization,
    data.contactName,
    data.phone,
    data.email,
    data.inquiryType,
    data.message
  );
  return result.lastInsertRowid;
}

module.exports = { initDb, insertInquiry };
