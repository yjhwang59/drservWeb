interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  MAIL_RECIPIENT: string;
  ADMIN_API_KEY?: string;
  ASSETS?: Fetcher;
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

function parseRecipients(recipientStr: string): string[] {
  return recipientStr
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function sendEmail(
  apiKey: string,
  recipientStr: string,
  data: InquiryData,
): Promise<{ sent: boolean; error?: string }> {
  if (!apiKey) {
    console.error('[sendEmail] RESEND_API_KEY not configured');
    return { sent: false, error: 'RESEND_API_KEY not configured' };
  }
  const recipients = parseRecipients(recipientStr);
  if (recipients.length === 0) {
    console.error('[sendEmail] No valid recipients');
    return { sent: false, error: 'No valid recipients' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `捨得資訊官網 <noreply@drserv.com.tw>`,
        to: recipients,
        subject: `[官網洽詢] ${data.organization} - ${data.inquiryType}`,
        text: buildEmailBody(data),
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`[sendEmail] Resend API error (${res.status}): ${err}`);
      return { sent: false, error: err };
    }
    return { sent: true };
  } catch (err) {
    console.error(`[sendEmail] Exception: ${String(err)}`);
    return { sent: false, error: String(err) };
  }
}

async function sendReplyToCustomer(
  apiKey: string,
  toEmail: string,
  replyText: string,
  context?: { organization?: string; inquiry_type?: string },
): Promise<{ sent: boolean; error?: string }> {
  if (!apiKey) {
    console.error('[sendReplyToCustomer] RESEND_API_KEY not configured');
    return { sent: false, error: 'RESEND_API_KEY not configured' };
  }
  const trimmed = toEmail.trim();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { sent: false, error: 'Invalid recipient email' };
  }
  const org = context?.organization ?? '';
  const type = context?.inquiry_type ?? '';
  const body = [
    '您好，',
    '',
    '以下是捨得資訊針對您的洽詢所回覆的內容：',
    '',
    '---',
    replyText,
    '---',
    '',
    org || type ? `（洽詢：${[org, type].filter(Boolean).join(' - ')}）` : '',
    '',
    '此信件由捨得資訊官網後台寄出，如有疑問歡迎再與我們聯絡。',
  ]
    .filter((line) => line !== '')
    .join('\n');
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `捨得資訊官網 <noreply@drserv.com.tw>`,
        to: [trimmed],
        subject: '【捨得資訊】回覆您的洽詢',
        text: body,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`[sendReplyToCustomer] Resend API error (${res.status}): ${err}`);
      return { sent: false, error: err };
    }
    return { sent: true };
  } catch (err) {
    console.error(`[sendReplyToCustomer] Exception: ${String(err)}`);
    return { sent: false, error: String(err) };
  }
}

function adminAuth(request: Request, env: Env): Response | null {
  const key = env.ADMIN_API_KEY;
  if (!key) return Response.json({ success: false, message: '後台未設定 ADMIN_API_KEY' }, { status: 501 });
  const auth = request.headers.get('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== key) return Response.json({ success: false, message: '未授權' }, { status: 401 });
  return null;
}

async function getMenuTree(db: D1Database): Promise<unknown[]> {
  const { results } = await db
    .prepare(
      'SELECT id, parent_id, menu_code, menu_name, menu_icon, menu_url, menu_type, sort_order FROM menu_items WHERE is_visible = 1 ORDER BY COALESCE(parent_id, 0), sort_order',
    )
    .all();
  const rows = (results || []) as { id: number; parent_id: number | null; menu_code: string; menu_name: string; menu_icon: string | null; menu_url: string; menu_type: string; sort_order: number }[];
  const byId = new Map<number, { id: number; parent_id: number | null; menu_code: string; menu_name: string; menu_icon: string | null; menu_url: string; menu_type: string; sort_order: number; children: unknown[] }>();
  const roots: unknown[] = [];
  for (const r of rows) {
    const node = { ...r, children: [] as unknown[] };
    byId.set(r.id, node);
    if (r.parent_id == null) roots.push(node);
    else {
      const parent = byId.get(r.parent_id);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  }
  roots.sort((a: unknown, b: unknown) => (a as { sort_order: number }).sort_order - (b as { sort_order: number }).sort_order);
  roots.forEach((r: unknown) => (r as { children: unknown[] }).children.sort((a: unknown, b: unknown) => (a as { sort_order: number }).sort_order - (b as { sort_order: number }).sort_order));
  return roots;
}

async function handleGetMenu(env: Env): Promise<Response> {
  try {
    const menu = await getMenuTree(env.DB);
    return Response.json({ success: true, menu });
  } catch (err) {
    console.error('GET /api/menu:', err);
    return Response.json({ success: true, menu: [] });
  }
}

async function handleGetInquiryTypes(env: Env): Promise<Response> {
  try {
    const { results } = await env.DB.prepare('SELECT id, label, sort_order FROM inquiry_types ORDER BY sort_order, id').all();
    return Response.json({ success: true, items: results || [] });
  } catch (err) {
    console.error('GET /api/inquiry-types:', err);
    return Response.json({ success: false, message: '伺服器錯誤' }, { status: 500 });
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
    const recipientStr = env.MAIL_RECIPIENT || 'service@drserv.com.tw';
    const mailResult = await sendEmail(env.RESEND_API_KEY, recipientStr, data);
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

// Admin: inquiry types
async function handleAdminGetInquiryTypes(env: Env): Promise<Response> {
  try {
    const { results } = await env.DB.prepare('SELECT id, label, sort_order FROM inquiry_types ORDER BY sort_order, id').all();
    return Response.json({ success: true, items: results || [] });
  } catch (err) {
    console.error('GET /api/admin/inquiry-types:', err);
    return Response.json({ success: false, message: '伺服器錯誤' }, { status: 500 });
  }
}

async function handleAdminPostInquiryTypes(request: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: '無效的 JSON 格式' }, { status: 400 });
  }
  const label = body.label != null ? String(body.label).trim() : '';
  if (!label) return Response.json({ success: false, message: '請提供 label' }, { status: 400 });
  const sort_order = body.sort_order != null ? Number(body.sort_order) : 0;
  try {
    const result = await env.DB.prepare('INSERT INTO inquiry_types (label, sort_order) VALUES (?, ?)').bind(label, sort_order).run();
    return Response.json({ success: true, id: result.meta?.last_row_id, message: '已新增' }, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/inquiry-types:', err);
    return Response.json({ success: false, message: '伺服器錯誤' }, { status: 500 });
  }
}

async function handleAdminPutInquiryTypes(id: number, request: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: '無效的 JSON 格式' }, { status: 400 });
  }
  const existing = await env.DB.prepare('SELECT id FROM inquiry_types WHERE id = ?').bind(id).first();
  if (!existing) return Response.json({ success: false, message: '找不到該選項' }, { status: 404 });
  const label = body.label != null ? String(body.label).trim() : undefined;
  const sort_order = body.sort_order != null ? Number(body.sort_order) : undefined;
  if (label === undefined && sort_order === undefined) {
    return Response.json({ success: true, message: '無變更' });
  }
  try {
    if (label !== undefined) await env.DB.prepare('UPDATE inquiry_types SET label = ? WHERE id = ?').bind(label, id).run();
    if (sort_order !== undefined) await env.DB.prepare('UPDATE inquiry_types SET sort_order = ? WHERE id = ?').bind(sort_order, id).run();
    return Response.json({ success: true, message: '已更新' });
  } catch (err) {
    console.error('PUT /api/admin/inquiry-types/:id:', err);
    return Response.json({ success: false, message: '伺服器錯誤' }, { status: 500 });
  }
}

async function handleAdminDeleteInquiryTypes(id: number, env: Env): Promise<Response> {
  try {
    await env.DB.prepare('DELETE FROM inquiry_types WHERE id = ?').bind(id).run();
    return Response.json({ success: true, message: '已刪除' });
  } catch (err) {
    console.error('DELETE /api/admin/inquiry-types/:id:', err);
    return Response.json({ success: false, message: '伺服器錯誤' }, { status: 500 });
  }
}

// Admin: inquiries
async function handleAdminGetInquiries(url: URL, env: Env): Promise<Response> {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
  const status = url.searchParams.get('status')?.trim() || undefined;
  const inquiry_type = url.searchParams.get('inquiry_type')?.trim() || undefined;
  const offset = (page - 1) * limit;
  try {
    const parts: string[] = [];
    const params: (string | number)[] = [];
    if (status) {
      parts.push('status = ?');
      params.push(status);
    }
    if (inquiry_type) {
      parts.push('inquiry_type = ?');
      params.push(inquiry_type);
    }
    const where = parts.length ? ' WHERE ' + parts.join(' AND ') : '';
    const countResult = params.length
      ? await env.DB.prepare('SELECT COUNT(*) as total FROM inquiries' + where).bind(...params).first()
      : await env.DB.prepare('SELECT COUNT(*) as total FROM inquiries').first();
    const total = (countResult as { total: number } | null)?.total ?? 0;
    const selectSql = 'SELECT id, organization, contact_name, phone, email, inquiry_type, message, status, created_at, admin_reply, replied_at FROM inquiries' + where + ' ORDER BY id DESC LIMIT ? OFFSET ?';
    const selectParams = params.length ? [...params, limit, offset] : [limit, offset];
    const { results } = await env.DB.prepare(selectSql).bind(...selectParams).all();
    return Response.json({ success: true, data: results || [], total });
  } catch (err) {
    console.error('GET /api/admin/inquiries:', err);
    return Response.json({ success: false, message: '伺服器錯誤' }, { status: 500 });
  }
}

async function handleAdminGetInquiry(id: number, env: Env): Promise<Response> {
  try {
    const row = await env.DB.prepare(
      'SELECT id, organization, contact_name, phone, email, inquiry_type, message, status, created_at, admin_reply, replied_at FROM inquiries WHERE id = ?',
    )
      .bind(id)
      .first();
    if (!row) return Response.json({ success: false, message: '找不到該筆洽詢' }, { status: 404 });
    return Response.json({ success: true, data: row });
  } catch (err) {
    console.error('GET /api/admin/inquiries/:id:', err);
    return Response.json({ success: false, message: '伺服器錯誤' }, { status: 500 });
  }
}

async function handleAdminPatchInquiry(id: number, request: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: '無效的 JSON 格式' }, { status: 400 });
  }
  const existing = await env.DB.prepare(
    'SELECT id, email, organization, inquiry_type FROM inquiries WHERE id = ?',
  )
    .bind(id)
    .first();
  if (!existing) return Response.json({ success: false, message: '找不到該筆洽詢' }, { status: 404 });
  const row = existing as { id: number; email: string; organization: string; inquiry_type: string };
  const updates: string[] = [];
  const params: (string | number)[] = [];
  const replyText =
    body.admin_reply !== undefined ? String(body.admin_reply).trim() : undefined;
  const sendToCustomer = Boolean(body.send_to_customer);
  const repliedAt =
    body.replied_at !== undefined
      ? body.replied_at
        ? String(body.replied_at)
        : null
      : replyText
        ? new Date().toISOString()
        : null;

  if (body.admin_reply !== undefined) {
    updates.push('admin_reply = ?');
    params.push(replyText ?? '');
  }
  if (body.replied_at !== undefined) {
    updates.push('replied_at = ?');
    params.push(body.replied_at ? String(body.replied_at) : null);
  } else if (replyText && repliedAt) {
    updates.push('replied_at = ?');
    params.push(repliedAt);
  }
  if (body.status !== undefined) {
    updates.push('status = ?');
    params.push(String(body.status).trim());
  }
  if (updates.length === 0) return Response.json({ success: true, message: '無變更' });

  let emailSent = false;
  if (replyText !== undefined && replyText !== '') {
    const at = repliedAt ?? new Date().toISOString();
    if (sendToCustomer && row.email) {
      const mailResult = await sendReplyToCustomer(env.RESEND_API_KEY, row.email, replyText, {
        organization: row.organization,
        inquiry_type: row.inquiry_type,
      });
      emailSent = mailResult.sent;
    }
    await env.DB.prepare(
      'INSERT INTO inquiry_replies (inquiry_id, reply_text, replied_at, sent_to_customer) VALUES (?, ?, ?, ?)',
    )
      .bind(id, replyText, at, sendToCustomer && emailSent ? 1 : 0)
      .run();
  }

  params.push(id);
  await env.DB.prepare('UPDATE inquiries SET ' + updates.join(', ') + ' WHERE id = ?').bind(...params).run();
  return Response.json({
    success: true,
    message: emailSent ? '已更新並已寄送給提問者' : '已更新',
    emailSent,
  });
}

async function handleAdminGetInquiryReplies(id: number, env: Env): Promise<Response> {
  const existing = await env.DB.prepare('SELECT id FROM inquiries WHERE id = ?').bind(id).first();
  if (!existing) return Response.json({ success: false, message: '找不到該筆洽詢' }, { status: 404 });
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, inquiry_id, reply_text, replied_at, sent_to_customer FROM inquiry_replies WHERE inquiry_id = ? ORDER BY replied_at DESC',
    )
      .bind(id)
      .all();
    return Response.json({ success: true, data: results ?? [] });
  } catch (err) {
    console.error('GET /api/admin/inquiries/:id/replies:', err);
    return Response.json({ success: false, message: '伺服器錯誤' }, { status: 500 });
  }
}

async function handleAdminDeleteInquiry(id: number, env: Env): Promise<Response> {
  try {
    await env.DB.prepare('DELETE FROM inquiries WHERE id = ?').bind(id).run();
    return Response.json({ success: true, message: '已刪除' });
  } catch (err) {
    console.error('DELETE /api/admin/inquiries/:id:', err);
    return Response.json({ success: false, message: '伺服器錯誤' }, { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Public API
    if (pathname === '/api/menu' && request.method === 'GET') return handleGetMenu(env);
    if (pathname === '/api/inquiry-types' && request.method === 'GET') return handleGetInquiryTypes(env);
    if (pathname === '/api/inquiry' && request.method === 'POST') return handleInquiry(request, env);

    // Admin (require Bearer)
    if (pathname.startsWith('/api/admin/')) {
      const authErr = adminAuth(request, env);
      if (authErr) return authErr;
    }

    if (pathname === '/api/admin/inquiry-types' && request.method === 'GET') return handleAdminGetInquiryTypes(env);
    if (pathname === '/api/admin/inquiry-types' && request.method === 'POST') return handleAdminPostInquiryTypes(request, env);

    const inquiryTypesIdMatch = pathname.match(/^\/api\/admin\/inquiry-types\/(\d+)$/);
    if (inquiryTypesIdMatch) {
      const id = parseInt(inquiryTypesIdMatch[1], 10);
      if (request.method === 'PUT') return handleAdminPutInquiryTypes(id, request, env);
      if (request.method === 'DELETE') return handleAdminDeleteInquiryTypes(id, env);
    }

    if (pathname === '/api/admin/inquiries' && request.method === 'GET') return handleAdminGetInquiries(url, env);

    const inquiriesRepliesMatch = pathname.match(/^\/api\/admin\/inquiries\/(\d+)\/replies$/);
    if (inquiriesRepliesMatch && request.method === 'GET') {
      const id = parseInt(inquiriesRepliesMatch[1], 10);
      if (!Number.isInteger(id) || id < 1) return Response.json({ success: false, message: '無效的 id' }, { status: 400 });
      return handleAdminGetInquiryReplies(id, env);
    }

    const inquiriesIdMatch = pathname.match(/^\/api\/admin\/inquiries\/(\d+)$/);
    if (inquiriesIdMatch) {
      const id = parseInt(inquiriesIdMatch[1], 10);
      if (!Number.isInteger(id) || id < 1) return Response.json({ success: false, message: '無效的 id' }, { status: 400 });
      if (request.method === 'GET') return handleAdminGetInquiry(id, env);
      if (request.method === 'PATCH') return handleAdminPatchInquiry(id, request, env);
      if (request.method === 'DELETE') return handleAdminDeleteInquiry(id, env);
    }

    // SPA: pass through to static assets (e.g. /admin, /)
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
