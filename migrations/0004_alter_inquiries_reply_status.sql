-- Add reply and status columns to inquiries (SQLite / D1)
-- Run only if table already exists (e.g. after 0001). SQLite has no IF NOT EXISTS for columns; use one-time migration.
ALTER TABLE inquiries ADD COLUMN admin_reply TEXT NULL;
ALTER TABLE inquiries ADD COLUMN replied_at TEXT NULL;
ALTER TABLE inquiries ADD COLUMN status TEXT DEFAULT 'pending';
