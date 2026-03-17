-- Schema migrations version table (D1 / SQLite)
-- 用於追蹤已套用的 migration，避免重複執行或遺漏。
-- 新 migration 套用後可手動或透過腳本 INSERT 一筆 version 記錄。
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT DEFAULT (datetime('now'))
);
