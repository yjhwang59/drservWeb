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

  // Add reply/status columns if missing (SQLite has no IF NOT EXISTS for columns)
  for (const col of [
    'ALTER TABLE inquiries ADD COLUMN admin_reply TEXT NULL',
    'ALTER TABLE inquiries ADD COLUMN replied_at TEXT NULL',
    "ALTER TABLE inquiries ADD COLUMN status TEXT DEFAULT 'pending'",
  ]) {
    try {
      db.exec(col);
    } catch (e) {
      if (!/duplicate column name/i.test(e.message)) throw e;
    }
  }

  db.exec(`
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
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_menu_items_parent ON menu_items(parent_id);
    CREATE INDEX IF NOT EXISTS idx_menu_items_sort ON menu_items(sort_order);
    CREATE INDEX IF NOT EXISTS idx_menu_items_visible ON menu_items(is_visible);
  `);

  // Seed menu_items if empty
  const menuCount = db.prepare('SELECT COUNT(*) as n FROM menu_items').get();
  if (menuCount.n === 0) {
    db.exec(`
      INSERT INTO menu_items (parent_id, menu_code, menu_name, menu_icon, menu_url, menu_type, sort_order, is_visible) VALUES
      (NULL, 'dashboard', '儀表板', 'LayoutDashboard', '/admin', 'link', 0, 1),
      (NULL, 'contact_mgmt', '聯絡我們管理', 'Mail', '#', 'dropdown', 10, 1);
      INSERT INTO menu_items (parent_id, menu_code, menu_name, menu_icon, menu_url, menu_type, sort_order, is_visible)
      SELECT id, 'inquiry_types', '洽詢內容選項', 'List', '/admin/inquiry-types', 'link', 0, 1 FROM menu_items WHERE menu_code = 'contact_mgmt' LIMIT 1;
      INSERT INTO menu_items (parent_id, menu_code, menu_name, menu_icon, menu_url, menu_type, sort_order, is_visible)
      SELECT id, 'inquiries', '表單回覆', 'Inbox', '/admin/inquiries', 'link', 10, 1 FROM menu_items WHERE menu_code = 'contact_mgmt' LIMIT 1;
    `);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS inquiry_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_inquiry_types_sort ON inquiry_types(sort_order);
  `);

  const typeCount = db.prepare('SELECT COUNT(*) as n FROM inquiry_types').get();
  if (typeCount.n === 0) {
    db.exec(`
      INSERT INTO inquiry_types (label, sort_order) VALUES
      ('系統維運評估', 0), ('既有平台健檢', 10), ('年度維護規劃', 20), ('功能擴充規劃', 30), ('其他', 40);
    `);
  }
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

function getMenuTree() {
  const rows = db.prepare(
    'SELECT id, parent_id, menu_code, menu_name, menu_icon, menu_url, menu_type, sort_order, is_visible FROM menu_items WHERE is_visible = 1 ORDER BY COALESCE(parent_id, 0), sort_order'
  ).all();
  const byId = new Map();
  const roots = [];
  rows.forEach((r) => {
    const node = {
      id: r.id,
      parent_id: r.parent_id,
      menu_code: r.menu_code,
      menu_name: r.menu_name,
      menu_icon: r.menu_icon,
      menu_url: r.menu_url,
      menu_type: r.menu_type,
      sort_order: r.sort_order,
      children: [],
    };
    byId.set(r.id, node);
    if (r.parent_id == null) roots.push(node);
    else {
      const parent = byId.get(r.parent_id);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  });
  roots.sort((a, b) => a.sort_order - b.sort_order);
  roots.forEach((r) => r.children.sort((a, b) => a.sort_order - b.sort_order));
  return roots;
}

function getInquiryTypes() {
  return db.prepare('SELECT id, label, sort_order FROM inquiry_types ORDER BY sort_order, id').all();
}

function getInquiryTypeById(id) {
  return db.prepare('SELECT id, label, sort_order, created_at FROM inquiry_types WHERE id = ?').get(id);
}

function createInquiryType(label, sort_order) {
  const r = db.prepare('INSERT INTO inquiry_types (label, sort_order) VALUES (?, ?)').run(label, sort_order == null ? 0 : sort_order);
  return r.lastInsertRowid;
}

function updateInquiryType(id, label, sort_order) {
  if (label !== undefined) db.prepare('UPDATE inquiry_types SET label = ? WHERE id = ?').run(label, id);
  if (sort_order !== undefined) db.prepare('UPDATE inquiry_types SET sort_order = ? WHERE id = ?').run(sort_order, id);
}

function deleteInquiryType(id) {
  return db.prepare('DELETE FROM inquiry_types WHERE id = ?').run(id);
}

function getInquiries(page = 1, limit = 20, status, inquiry_type) {
  const offset = (Math.max(1, page) - 1) * limit;
  const where = [];
  const params = [];
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  if (inquiry_type) {
    where.push('inquiry_type = ?');
    params.push(inquiry_type);
  }
  const whereClause = where.length ? ' WHERE ' + where.join(' AND ') : '';
  const countRow = db.prepare('SELECT COUNT(*) as total FROM inquiries' + whereClause).get(...params);
  const rows = db.prepare(
    'SELECT id, organization, contact_name, phone, email, inquiry_type, message, status, created_at, admin_reply, replied_at FROM inquiries' + whereClause + ' ORDER BY id DESC LIMIT ? OFFSET ?'
  ).all(...params, limit, offset);
  return { data: rows, total: countRow.total };
}

function getInquiryById(id) {
  return db.prepare(
    'SELECT id, organization, contact_name, phone, email, inquiry_type, message, status, created_at, admin_reply, replied_at FROM inquiries WHERE id = ?'
  ).get(id);
}

function updateInquiry(id, fields) {
  const set = [];
  const params = [];
  if (fields.admin_reply !== undefined) {
    set.push('admin_reply = ?');
    params.push(fields.admin_reply);
  }
  if (fields.replied_at !== undefined) {
    set.push('replied_at = ?');
    params.push(fields.replied_at);
  }
  if (fields.status !== undefined) {
    set.push('status = ?');
    params.push(fields.status);
  }
  if (set.length === 0) return;
  params.push(id);
  db.prepare('UPDATE inquiries SET ' + set.join(', ') + ' WHERE id = ?').run(...params);
}

function deleteInquiry(id) {
  return db.prepare('DELETE FROM inquiries WHERE id = ?').run(id);
}

module.exports = {
  initDb,
  insertInquiry,
  getMenuTree,
  getInquiryTypes,
  getInquiryTypeById,
  createInquiryType,
  updateInquiryType,
  deleteInquiryType,
  getInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry,
};
