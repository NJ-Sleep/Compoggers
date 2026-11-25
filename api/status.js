// Dashboard reads everything it needs here (GET, x-pin)
import { redis, pinAuth, COOLDOWN_MS } from './_lib.js';

export default async function handler(req, res) {
  if (!pinAuth(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');

  const [telemetry, command] = await Promise.all([
    redis.get('rack:telemetry'),
    redis.get('rack:command'),
  ]);
  const now = Date.now();

  let cooldownMs = command ? COOLDOWN_MS - (now - command.createdAt) : 0;
  if (telemetry) cooldownMs = Math.max(cooldownMs, (telemetry.cooldownMs || 0) - (now - telemetry.receivedAt));

  res.json({
    telemetry: telemetry || null,
    command: command || null,
    cooldownMs: Math.max(0, cooldownMs),
    online: telemetry ? now - telemetry.receivedAt < 5 * 60_000 : false,
    serverTime: now,
  });
}
