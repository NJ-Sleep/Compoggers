import { Redis } from '@upstash/redis';

// Reads UPSTASH_REDIS_REST_URL / _TOKEN (or KV_REST_API_URL / _TOKEN) set by the Vercel Upstash integration.
export const redis = Redis.fromEnv();

export const COOLDOWN_MS = 60_000;   // button cooldown
export const MIN_RUN_MS = 500;
export const MAX_RUN_MS = 30_000;

export function deviceAuth(req, res) {
  const key = process.env.DEVICE_API_KEY;
  if (!key || req.headers['x-api-key'] !== key) {
    res.status(401).json({ error: 'bad device key' });
    return false;
  }
  return true;
}

// Dashboard PIN is optional: if DASHBOARD_PIN is not set, the dashboard is open.
export function pinAuth(req, res) {
  const pin = process.env.DASHBOARD_PIN;
  if (!pin) return true;
  if (req.headers['x-pin'] !== pin) {
    res.status(401).json({ error: 'pin required' });
    return false;
  }
  return true;
}

export function parseBody(req) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body || {};
}

export const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
