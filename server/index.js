require('dotenv').config();
const express = require('express');
const cors = require('cors');

let dbAvailable = false;
let dbError = null;
let db = null;

try {
  db = require('./db');
  db.initDb();
  dbAvailable = true;
} catch (err) {
  dbError = err;
  console.error('Database failed to initialize:', err.message);
  console.error('Backend will run but /api/inquiry will return 503. Fix: in server folder run "npm install" or "npm rebuild better-sqlite3"');
}

let sendInquiryEmail = async () => ({ sent: false, error: 'Mail module not loaded' });
try {
  sendInquiryEmail = require('./mail').sendInquiryEmail;
} catch (err) {
  console.error('Mail module failed to load:', err.message);
}

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';

function adminAuth(req, res, next) {
  if (!ADMIN_API_KEY) {
    return res.status(501).json({ success: false, message: '後台未設定 ADMIN_API_KEY' });
  }
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== ADMIN_API_KEY) {
    return res.status(401).json({ success: false, message: '未授權' });
  }
  next();
}

app.use(cors({ origin: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'DrServ API',
    status: 'running',
    database: dbAvailable ? 'connected' : 'unavailable',
    endpoints: {
      'GET  /': 'API 資訊（本頁）',
      'GET  /api/health': '健康檢查',
      'GET  /api/menu': '後台選單樹',
      'GET  /api/inquiry-types': '洽詢內容選項（公開）',
      'POST /api/inquiry': '送出洽詢表單',
      'GET/POST/PUT/DELETE /api/admin/inquiry-types': '洽詢內容 CRUD（需 Bearer）',
      'GET /api/admin/inquiries': '洽詢列表',
      'GET/PATCH/DELETE /api/admin/inquiries/:id': '洽詢詳情/回覆/刪除',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.status(dbAvailable ? 200 : 503).json({
    ok: dbAvailable,
    message: dbAvailable ? 'API and database OK' : 'API running but database unavailable',
    dbError: dbError ? dbError.message : undefined,
  });
});

// --- Public: menu tree (for admin sidebar)
app.get('/api/menu', (req, res) => {
  if (!dbAvailable || !db) {
    return res.status(503).json({ success: true, menu: [] });
  }
  try {
    const menu = db.getMenuTree();
    res.json({ success: true, menu });
  } catch (err) {
    console.error('GET /api/menu:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

// --- Public: inquiry types (for contact form dropdown)
app.get('/api/inquiry-types', (req, res) => {
  if (!dbAvailable || !db) {
    return res.status(503).json({ success: false, message: '資料庫無法使用' });
  }
  try {
    const items = db.getInquiryTypes();
    res.json({ success: true, items });
  } catch (err) {
    console.error('GET /api/inquiry-types:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

const inquiryFields = ['organization', 'contactName', 'phone', 'email', 'inquiryType', 'message'];

function validateBody(body) {
  const missing = inquiryFields.filter((f) => !body[f] || String(body[f]).trim() === '');
  if (missing.length) {
    return { ok: false, message: `缺少欄位: ${missing.join(', ')}` };
  }
  if (body.message && body.message.length < 10) {
    return { ok: false, message: '訊息內容至少 10 個字' };
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(String(body.email).trim())) {
    return { ok: false, message: '請輸入有效的電子郵件' };
  }
  return { ok: true };
}

app.post('/api/inquiry', async (req, res) => {
  if (!dbAvailable || !db) {
    return res.status(503).json({
      success: false,
      message: '資料庫無法使用，請檢查後端視窗錯誤訊息並重試（例如在 server 資料夾執行 npm install）',
    });
  }

  const validation = validateBody(req.body);
  if (!validation.ok) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const data = {
    organization: String(req.body.organization).trim(),
    contactName: String(req.body.contactName).trim(),
    phone: String(req.body.phone).trim(),
    email: String(req.body.email).trim(),
    inquiryType: String(req.body.inquiryType).trim(),
    message: String(req.body.message).trim(),
  };

  try {
    const id = db.insertInquiry(data);
    const mailResult = await sendInquiryEmail(data);

    res.status(201).json({
      success: true,
      id,
      emailSent: mailResult.sent,
      message: mailResult.sent ? '已儲存並寄出通知信' : '已儲存，但未寄出通知信（請檢查 SMTP 設定）',
    });
  } catch (err) {
    console.error('Inquiry error:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤，請稍後再試' });
  }
});

// --- Admin: inquiry types CRUD
app.get('/api/admin/inquiry-types', adminAuth, (req, res) => {
  if (!dbAvailable || !db) return res.status(503).json({ success: false, message: '資料庫無法使用' });
  try {
    const items = db.getInquiryTypes();
    res.json({ success: true, items });
  } catch (err) {
    console.error('GET /api/admin/inquiry-types:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

app.post('/api/admin/inquiry-types', adminAuth, (req, res) => {
  if (!dbAvailable || !db) return res.status(503).json({ success: false, message: '資料庫無法使用' });
  const label = req.body.label != null ? String(req.body.label).trim() : '';
  if (!label) return res.status(400).json({ success: false, message: '請提供 label' });
  const sort_order = req.body.sort_order != null ? Number(req.body.sort_order) : 0;
  try {
    const id = db.createInquiryType(label, sort_order);
    res.status(201).json({ success: true, id, message: '已新增' });
  } catch (err) {
    console.error('POST /api/admin/inquiry-types:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

app.put('/api/admin/inquiry-types/:id', adminAuth, (req, res) => {
  if (!dbAvailable || !db) return res.status(503).json({ success: false, message: '資料庫無法使用' });
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ success: false, message: '無效的 id' });
  const existing = db.getInquiryTypeById(id);
  if (!existing) return res.status(404).json({ success: false, message: '找不到該選項' });
  const label = req.body.label != null ? String(req.body.label).trim() : undefined;
  const sort_order = req.body.sort_order != null ? Number(req.body.sort_order) : undefined;
  if (label === undefined && sort_order === undefined) {
    return res.json({ success: true, message: '無變更' });
  }
  try {
    db.updateInquiryType(id, label, sort_order);
    res.json({ success: true, message: '已更新' });
  } catch (err) {
    console.error('PUT /api/admin/inquiry-types/:id:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

app.delete('/api/admin/inquiry-types/:id', adminAuth, (req, res) => {
  if (!dbAvailable || !db) return res.status(503).json({ success: false, message: '資料庫無法使用' });
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ success: false, message: '無效的 id' });
  try {
    db.deleteInquiryType(id);
    res.json({ success: true, message: '已刪除' });
  } catch (err) {
    console.error('DELETE /api/admin/inquiry-types/:id:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

// --- Admin: inquiries list / detail / update / delete
app.get('/api/admin/inquiries', adminAuth, (req, res) => {
  if (!dbAvailable || !db) return res.status(503).json({ success: false, message: '資料庫無法使用' });
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const status = req.query.status ? String(req.query.status).trim() : undefined;
  const inquiry_type = req.query.inquiry_type ? String(req.query.inquiry_type).trim() : undefined;
  try {
    const { data, total } = db.getInquiries(page, limit, status, inquiry_type);
    res.json({ success: true, data, total });
  } catch (err) {
    console.error('GET /api/admin/inquiries:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

app.get('/api/admin/inquiries/:id', adminAuth, (req, res) => {
  if (!dbAvailable || !db) return res.status(503).json({ success: false, message: '資料庫無法使用' });
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ success: false, message: '無效的 id' });
  const row = db.getInquiryById(id);
  if (!row) return res.status(404).json({ success: false, message: '找不到該筆洽詢' });
  res.json({ success: true, data: row });
});

app.patch('/api/admin/inquiries/:id', adminAuth, (req, res) => {
  if (!dbAvailable || !db) return res.status(503).json({ success: false, message: '資料庫無法使用' });
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ success: false, message: '無效的 id' });
  const existing = db.getInquiryById(id);
  if (!existing) return res.status(404).json({ success: false, message: '找不到該筆洽詢' });
  const fields = {};
  if (req.body.admin_reply !== undefined) fields.admin_reply = String(req.body.admin_reply).trim();
  if (req.body.replied_at !== undefined) fields.replied_at = req.body.replied_at ? String(req.body.replied_at) : null;
  if (req.body.status !== undefined) fields.status = String(req.body.status).trim();
  if (Object.keys(fields).length === 0) return res.json({ success: true, message: '無變更' });
  if (fields.admin_reply && !fields.replied_at) fields.replied_at = new Date().toISOString();
  try {
    db.updateInquiry(id, fields);
    res.json({ success: true, message: '已更新' });
  } catch (err) {
    console.error('PATCH /api/admin/inquiries/:id:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

app.delete('/api/admin/inquiries/:id', adminAuth, (req, res) => {
  if (!dbAvailable || !db) return res.status(503).json({ success: false, message: '資料庫無法使用' });
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ success: false, message: '無效的 id' });
  try {
    db.deleteInquiry(id);
    res.json({ success: true, message: '已刪除' });
  } catch (err) {
    console.error('DELETE /api/admin/inquiries/:id:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
  if (!dbAvailable) {
    console.log('WARNING: Database unavailable. POST /api/inquiry will return 503.');
  }
  if (!ADMIN_API_KEY) {
    console.log('WARNING: ADMIN_API_KEY not set. Admin routes will return 501.');
  }
});
