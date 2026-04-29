# LPG Gas Leakage & Automatic Shutoff Dashboard

A deployment-ready React dashboard for an LPG gas leakage detection and automatic shutoff IoT prototype.

## Tech Stack

- Frontend: React.js with Vite
- Styling: Tailwind CSS
- Animations: Framer Motion
- Backend: Firebase Realtime Database
- Charts: Recharts
- Hosting: Vercel or Firebase Hosting

## Firebase Data Shape

```json
{
  "LPG": {
    "GasValue": 312,
    "Status": "Safe",
    "System": "Valve Open"
  }
}
```

The dashboard does not generate demo readings. Gauge, chart, status, valve state, and logs update only from the Firebase `/LPG` node.

## Local Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

## Build

```bash
npm run build
```

## Pages

- Dashboard: live gas value, threshold state, valve status, buzzer status, realtime chart, status log.
- Project Overview: hardware components, data flow, Arduino logic, and deployment stack.
