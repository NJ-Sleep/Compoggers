// ESP32 -> server: latest readings (POST, x-api-key)
import { redis, deviceAuth, parseBody, num } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!deviceAuth(req, res)) return;

  const b = parseBody(req);
  const now = Date.now();
  const prev = (await redis.get('rack:telemetry')) || {};

  const temperature = num(b.temperature);
  const humidity = num(b.humidity);

  const t = {
    // keep the last good DHT22 values if a read failed
    temperature: temperature ?? prev.temperature ?? null,
    humidity: humidity ?? prev.humidity ?? null,
    dhtAt: temperature !== null || humidity !== null ? now : prev.dhtAt ?? null,
    raining: !!b.raining,
    position: b.position === 'out' ? 'out' : 'in',
    moving: !!b.moving,
    servoAngle: num(b.servoAngle),
    cooldownMs: num(b.cooldownMs) ?? 0,
    motorRunMs: num(b.motorRunMs),
    lastCommandId: num(b.lastCommandId) ?? 0,
    lastResult: String(b.lastResult || '').slice(0, 40),
    ldr: Array.isArray(b.ldr) ? b.ldr.slice(0, 5).map(Number).filter(Number.isFinite) : [],
    receivedAt: now,
  };

  await redis.set('rack:telemetry', t);
  res.json({ ok: true });
}
