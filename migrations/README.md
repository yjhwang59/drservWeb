# D1 Migrations

本目錄為 Cloudflare D1 的 SQL 遷移檔，依檔名數字順序套用。

## schema_migrations 版本表

自 `0005_schema_migrations.sql` 起，資料庫內有 `schema_migrations` 表，用來記錄已套用的 migration：

| 欄位 | 說明 |
|------|------|
| `version` | 檔名，例如 `0005_schema_migrations.sql` |
| `applied_at` | 套用時間 |

**使用方式（選用）：** 新增 migration 後，可在該 SQL 檔末尾加上：

```sql
INSERT OR IGNORE INTO schema_migrations (version) VALUES ('0006_your_migration.sql');
```

CI 目前仍依序執行所有 `.sql` 檔（冪等設計），此表可供日後實作「僅執行未套用 migration」時使用。
