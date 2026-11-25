// Dashboard -> server: pull clothes in or push them out (POST, x-pin)
import { redis, pinAuth, parseBody, COOLDOWN_MS, MIN_RUN_MS, MAX_RUN_MS } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!pinAuth(req, res)) return;

  const b = parseBody(req);
  const action = b.action;
  if (action !== 'in' && action !== 'out') {
    return res.status(400).json({ error: 'action must be "in" or "out"' });
  }

  const [tel, prev] = await Promise.all([redis.get('rack:telemetry'), redis.get('rack:command')]);
  const now = Date.now();

  // 1 minute cooldown between button presses
  let left = prev ? COOLDOWN_MS - (now - prev.createdAt) : 0;
  // ...and the rack's own cooldown (e.g. after a rain retract)
  if (tel) left = Math.max(left, (tel.cooldownMs || 0) - (now - tel.receivedAt));
  if (left > 0) return res.status(429).json({ error: 'cooldown', remainingMs: left });

  if (action === 'out' && tel?.raining) {
    return res.status(409).json({ error: 'raining' });
  }

  const cmd = { id: await redis.incr('rack:commandSeq'), action, createdAt: now };
  const runMs = Number(b.runMs);
  if (Number.isFinite(runMs) && runMs > 0) {
    cmd.runMs = Math.min(MAX_RUN_MS, Math.max(MIN_RUN_MS, Math.round(runMs)));
  }

  await redis.set('rack:command', cmd);
  res.json({ ok: true, command: cmd, cooldownMs: COOLDOWN_MS });
}
