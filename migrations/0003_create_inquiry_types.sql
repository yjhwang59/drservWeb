-- Inquiry type options for contact form dropdown (SQLite / D1)
CREATE TABLE IF NOT EXISTS inquiry_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inquiry_types_sort ON inquiry_types(sort_order);

-- Seed from content.ts: 系統維運評估, 既有平台健檢, 年度維護規劃, 功能擴充規劃, 其他
INSERT INTO inquiry_types (label, sort_order) VALUES
('系統維運評估', 0),
('既有平台健檢', 10),
('年度維護規劃', 20),
('功能擴充規劃', 30),
('其他', 40);
