require('dotenv').config();
const express = require('express');
const cors = require('cors');

let dbAvailable = false;
let dbError = null;
let insertInquiry = null;

try {
  const db = require('./db');
  insertInquiry = db.insertInquiry;
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

app.use(cors({ origin: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'DrServ API',
    status: 'running',
    database: dbAvailable ? 'connected' : 'unavailable',
    endpoints: {
      'GET  /':             'API 資訊（本頁）',
      'GET  /api/health':   '健康檢查',
      'POST /api/inquiry':  '送出洽詢表單',
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
  if (!dbAvailable || !insertInquiry) {
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
    const id = insertInquiry(data);
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

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
  if (!dbAvailable) {
    console.log('WARNING: Database unavailable. POST /api/inquiry will return 503.');
  }
});
