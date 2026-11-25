# Laundry rack: Vercel app

Dashboard + API for the sun-tracking laundry rack (ESP32).

```
public/index.html      dashboard (rain status, temperature, humidity, pull-in / push-out button)
api/telemetry.js       ESP32 -> server   POST  readings every 2 min (and on events)
api/command.js         ESP32 <- server   GET   latest button press (polled every 3 s)
api/button.js          dashboard -> server POST button press, 1 min cooldown, blocks "out" while raining
api/status.js          dashboard <- server GET  everything the page shows
api/_lib.js            shared helpers (Redis, auth, constants)
```

## Deploy

1. Push this folder to a GitHub repo (or use the Vercel CLI: `npm i -g vercel && vercel`).
2. In Vercel, import the project. Framework preset: **Other**.
3. Project > Storage > add an **Upstash Redis** database from the Marketplace and connect it to the project.
   This adds the `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_*`) variables.
4. Project > Settings > Environment Variables, add:

   | Name | Value |
   |---|---|
   | `DEVICE_API_KEY` | a long random string; the same value goes in the ESP32 code as `API_KEY` |
   | `DASHBOARD_PIN` | optional access code for the dashboard and button (leave out for no lock) |

5. Redeploy, then put your URL in the ESP32 code (`SERVER_URL`).

## Test without the ESP32

```bash
URL=https://your-app.vercel.app
KEY=your-device-key

# fake a reading
curl -X POST $URL/api/telemetry -H "x-api-key: $KEY" -H "content-type: application/json" \
  -d '{"temperature":31.4,"humidity":62,"raining":false,"position":"in","moving":false,"cooldownMs":0,"motorRunMs":5000,"ldr":[1200,2300,3100,2800,900],"servoAngle":90}'

# what the ESP32 sees after you press the dashboard button
curl $URL/api/command -H "x-api-key: $KEY"
```

## Notes

- Vercel cannot call the ESP32, so the ESP32 polls `/api/command` every 3 s. A button press reaches the rack within a few seconds.
- The 1 minute cooldown is enforced on the server, on the ESP32, and shown as a countdown on the button.
- Rain retract is done by the ESP32 itself and ignores the cooldown. "Push out" is refused while it is raining.
- The dashboard shows the rack as offline if no report arrives for 5 minutes.
