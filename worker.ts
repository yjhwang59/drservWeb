interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  MAIL_RECIPIENT: string;
}

interface InquiryData {
  organization: string;
  contactName: string;
  phone: string;
  email: string;
  inquiryType: string;
  message: string;
}

const REQUIRED_FIELDS = ['organization', 'contactName', 'phone', 'email', 'inquiryType', 'message'] as const;

function validate(body: Record<string, unknown>): { ok: true } | { ok: false; message: string } {
  const missing = REQUIRED_FIELDS.filter((f) => !body[f] || String(body[f]).trim() === '');
  if (missing.length) return { ok: false, message: `缺少欄位: ${missing.join(', ')}` };
  if (typeof body.message === 'string' && body.message.length < 10) {
    return { ok: false, message: '訊息內容至少 10 個字' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email).trim())) {
    return { ok: false, message: '請輸入有效的電子郵件' };
  }
  return { ok: true };
}

function buildEmailBody(data: InquiryData): string {
  return [
    '【網站立即洽詢】新表單提交',
    '',
    `機關名稱：${data.organization}`,
    `聯絡人姓名：${data.contactName}`,
    `聯絡電話：${data.phone}`,
    `Email：${data.email}`,
    `洽詢內容：${data.inquiryType}`,
    '',
    '訊息內容：',
    data.message,
    '',
    '---',
    '此信件由捨得資訊官網表單自動寄出，請勿直接回覆此信。',
  ].join('\n');
}

async function sendEmail(
  apiKey: string,
  recipient: string,
  data: InquiryData,
): Promise<{ sent: boolean; error?: string }> {
  if (!apiKey) return { sent: false, error: 'RESEND_API_KEY not configured' };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `捨得資訊官網 <noreply@drserv.com.tw>`,
        to: [recipient],
        subject: `[官網洽詢] ${data.organization} - ${data.inquiryType}`,
        text: buildEmailBody(data),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { sent: false, error: err };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, error: String(err) };
  }
}

async function handleInquiry(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ success: false, message: 'Method not allowed' }, { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: '無效的 JSON 格式' }, { status: 400 });
  }

  const validation = validate(body);
  if (!validation.ok) {
    return Response.json({ success: false, message: validation.message }, { status: 400 });
  }

  const data: InquiryData = {
    organization: String(body.organization).trim(),
    contactName: String(body.contactName).trim(),
    phone: String(body.phone).trim(),
    email: String(body.email).trim(),
    inquiryType: String(body.inquiryType).trim(),
    message: String(body.message).trim(),
  };

  try {
    const result = await env.DB.prepare(
      'INSERT INTO inquiries (organization, contact_name, phone, email, inquiry_type, message) VALUES (?, ?, ?, ?, ?, ?)',
    )
      .bind(data.organization, data.contactName, data.phone, data.email, data.inquiryType, data.message)
      .run();

    const recipient = env.MAIL_RECIPIENT || 'service@drserv.com.tw';
    const mailResult = await sendEmail(env.RESEND_API_KEY, recipient, data);

    return Response.json(
      {
        success: true,
        id: result.meta?.last_row_id,
        emailSent: mailResult.sent,
        message: mailResult.sent ? '已儲存並寄出通知信' : '已儲存，但未寄出通知信（請檢查郵件設定）',
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('Inquiry error:', err);
    return Response.json({ success: false, message: '伺服器錯誤，請稍後再試' }, { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/inquiry') {
      return handleInquiry(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
