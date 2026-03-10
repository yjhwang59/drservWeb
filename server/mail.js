const nodemailer = require('nodemailer');

const RECIPIENT = 'service@drserv.com.tw';

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function buildEmailBody(data) {
  return `
【網站立即洽詢】新表單提交

機關名稱：${data.organization}
聯絡人姓名：${data.contactName}
聯絡電話：${data.phone}
Email：${data.email}
洽詢內容：${data.inquiryType}

訊息內容：
${data.message}

---
此信件由捨得資訊官網表單自動寄出，請勿直接回覆此信。
  `.trim();
}

async function sendInquiryEmail(data) {
  const transport = createTransport();
  if (!transport) {
    console.warn('Mail: SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Skip sending.');
    return { sent: false, error: 'SMTP not configured' };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = `[官網洽詢] ${data.organization} - ${data.inquiryType}`;
  const text = buildEmailBody(data);

  try {
    await transport.sendMail({
      from: `"捨得資訊官網" <${from}>`,
      to: RECIPIENT,
      subject,
      text,
    });
    return { sent: true };
  } catch (err) {
    console.error('Mail send error:', err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = { sendInquiryEmail };
