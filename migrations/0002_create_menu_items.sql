-- Menu items for admin sidebar tree (compatible with SQLite / D1)
CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NULL,
  menu_code TEXT NOT NULL UNIQUE,
  menu_name TEXT NOT NULL,
  menu_icon TEXT,
  menu_url TEXT NOT NULL,
  menu_type TEXT NOT NULL DEFAULT 'link',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_menu_items_parent ON menu_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort ON menu_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_visible ON menu_items(is_visible);

-- Seed: admin dashboard, inquiry types, inquiries
INSERT INTO menu_items (parent_id, menu_code, menu_name, menu_icon, menu_url, menu_type, sort_order, is_visible) VALUES
(NULL, 'dashboard', '儀表板', 'LayoutDashboard', '/admin', 'link', 0, 1),
(NULL, 'contact_mgmt', '聯絡我們管理', 'Mail', '#', 'dropdown', 10, 1);

INSERT INTO menu_items (parent_id, menu_code, menu_name, menu_icon, menu_url, menu_type, sort_order, is_visible) VALUES
((SELECT id FROM menu_items WHERE menu_code = 'contact_mgmt' LIMIT 1), 'inquiry_types', '洽詢內容選項', 'List', '/admin/inquiry-types', 'link', 0, 1),
((SELECT id FROM menu_items WHERE menu_code = 'contact_mgmt' LIMIT 1), 'inquiries', '表單回覆', 'Inbox', '/admin/inquiries', 'link', 10, 1);
