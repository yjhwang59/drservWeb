import type { Env } from '../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    await context.env.DB.prepare('SELECT 1').first();
    return Response.json({ ok: true, message: 'API and database OK' });
  } catch (err) {
    return Response.json(
      { ok: false, message: 'API running but database unavailable', dbError: String(err) },
      { status: 503 },
    );
  }
};
