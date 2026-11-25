// ESP32 polls this for the latest button command (GET, x-api-key)
import { redis, deviceAuth } from './_lib.js';

export default async function handler(req, res) {
  if (!deviceAuth(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');

  const c = await redis.get('rack:command');
  if (!c) return res.json({ id: 0, action: 'none' });

  res.json({
    id: c.id,
    action: c.action,
    ...(c.runMs ? { runMs: c.runMs } : {}),
    ageMs: Date.now() - c.createdAt,
  });
}
