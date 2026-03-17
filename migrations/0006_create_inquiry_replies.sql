-- Reply history for inquiries (each save creates a row)
CREATE TABLE IF NOT EXISTS inquiry_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inquiry_id INTEGER NOT NULL,
  reply_text TEXT NOT NULL,
  replied_at TEXT NOT NULL,
  sent_to_customer INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_inquiry_replies_inquiry_id ON inquiry_replies(inquiry_id);
