# LPG Gas Leakage & Automatic Shutoff Dashboard

> A real-time IoT safety dashboard for an LPG leakage detection and automatic shutoff prototype built around an MQ-2 gas sensor, ESP8266 NodeMCU, buzzer, and MG996R servo-based valve mechanism.

The application connects to Firebase Realtime Database and presents the latest hardware state through a control-room style interface: live gas level, safety state, valve state, buzzer state, gas history, and status events.

> **Important:** This repository contains the web dashboard and Firebase integration. The ESP8266/Arduino firmware that physically reads the sensor and writes to Firebase is not included in this repository.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Problem](#problem)
- [How the System Works](#how-the-system-works)
- [System Architecture](#system-architecture)
- [Hardware](#hardware)
- [Firebase Data Contract](#firebase-data-contract)
- [Dashboard Features](#dashboard-features)
- [Safety Logic](#safety-logic)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Firebase Setup](#firebase-setup)
- [Running the Dashboard](#running-the-dashboard)
- [Build and Deployment](#build-and-deployment)
- [Data Flow](#data-flow)
- [Important Implementation Details](#important-implementation-details)
- [Limitations](#limitations)
- [Future Improvements](#future-improvements)
- [Safety Notice](#safety-notice)
- [License](#license)

---

## 🚨 Project Overview

LPG leakage can become dangerous when gas accumulates without being noticed. This project combines a physical gas-sensing/shutoff prototype with a web-based monitoring interface.

The intended end-to-end flow is:

**MQ-2 Sensor → ESP8266 → Firebase Realtime Database → React Dashboard**

When the gas level becomes dangerous, the hardware prototype is intended to:

1. Detect elevated LPG concentration using the MQ-2 sensor.
2. Activate a local buzzer.
3. Move the MG996R servo to close the gas valve.
4. Publish the latest gas reading and system state to Firebase.
5. Let the dashboard immediately reflect the new state.

The dashboard is deliberately **data-driven**. It does not invent or simulate sensor readings. If Firebase has no valid `GasValue`, the UI remains in a waiting state.

---

## 🎯 Problem

A conventional gas detector may provide only a local alarm. A connected system can additionally expose the current state through a web interface.

This project therefore focuses on three layers:

- **Detection** — read the gas sensor value.
- **Local response** — trigger the buzzer and automatic valve shutoff in the hardware prototype.
- **Visibility** — stream the latest state to a web dashboard through Firebase.

---

## ⚙️ How the System Works

### 1. Gas Sensing

The MQ-2 gas sensor provides an analog reading.

The dashboard treats the incoming value as a **0–1023 sensor scale**.

### 2. ESP8266 Processing

The ESP8266 NodeMCU acts as the hardware controller and communication layer.

It publishes:

- `GasValue`
- `Status`
- `System`

to Firebase.

### 3. Firebase

Firebase Realtime Database acts as the communication bridge between the physical prototype and the browser.

The dashboard listens to:

```text
/LPG
```

using Firebase's realtime listener.

### 4. React Dashboard

Whenever Firebase changes, the React application:

- validates the incoming value;
- normalizes the sensor reading;
- determines the alert state;
- updates the live gauge;
- adds the reading to the gas history;
- detects status changes;
- updates valve and buzzer indicators;
- records the latest update time.

---

## 🏗️ System Architecture

```text
┌─────────────────────┐
│    LPG Environment  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    MQ-2 Gas Sensor  │
│     Analog 0–1023   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   ESP8266 NodeMCU   │
│                     │
│ • Reads sensor      │
│ • Controls buzzer   │
│ • Controls servo    │
│ • Publishes state   │
└──────────┬──────────┘
           │ Wi-Fi
           ▼
┌─────────────────────────────┐
│ Firebase Realtime Database  │
│            /LPG             │
└────────────┬────────────────┘
             │ Realtime listener
             ▼
┌─────────────────────────────┐
│       React Web App         │
│                             │
│ • Live gas gauge            │
│ • Safety status             │
│ • Valve state               │
│ • Buzzer state              │
│ • Gas history               │
│ • Status log                │
└─────────────────────────────┘
```

---

## 🔌 Hardware

The hardware architecture represented in the project's Project Overview page contains:

| Component | Role |
|---|---|
| **MQ-2 Gas Sensor** | Detects gas concentration and provides the analog reading |
| **ESP8266 NodeMCU** | Main Wi-Fi controller and Firebase communication layer |
| **Active Buzzer** | Provides a local audible warning |
| **MG996R Servo Motor** | Drives the mechanical gas-valve shutoff mechanism |

### Hardware-to-Dashboard Relationship

The dashboard does **not** directly communicate with the MQ-2 or servo.

Instead:

```text
Sensor / Actuators
       ↓
    ESP8266
       ↓
    Firebase
       ↓
  Web Dashboard
```

The ESP8266 handles the physical system while the React application handles monitoring and visualization.

---

## ☁️ Firebase Data Contract

The dashboard expects the following structure at:

```text
/LPG
```

Example:

```json
{
  "LPG": {
    "GasValue": 312,
    "Status": "Safe",
    "System": "Valve Open"
  }
}
```

### Fields

| Field | Type | Purpose |
|---|---|---|
| `GasValue` | Number | Current sensor value |
| `Status` | String | Current gas status |
| `System` | String | Current system/valve state |

### Example Alert State

```json
{
  "LPG": {
    "GasValue": 520,
    "Status": "Gas Leak Detected",
    "System": "Valve Closed"
  }
}
```

The dashboard reads these values in realtime.

**It does not generate demo readings.**

---

# 📊 Dashboard Features

## 🟢 Live Gas Level

The dashboard displays the current sensor value using a circular gauge.

It provides:

- current numeric reading;
- visual gauge;
- safety classification;
- threshold indicator;
- safety explanation.

The gauge operates over the application's 0–1023 input range.

---

## 🚨 Live Safety Alert

The main status panel changes according to the latest Firebase state.

Possible states include:

- **System is safe**
- **Gas leak detected**
- **Waiting for live sensor data**
- **Firebase read permission is blocked**

When an alert occurs, the interface uses a visual pulse animation to make the condition noticeable.

---

## 🔧 Valve & Buzzer State

The valve state is derived from the Firebase `System` field.

For example:

```text
Valve Open
      ↓
Valve: Open
```

and:

```text
Valve Closed
      ↓
Valve: Closed
```

The dashboard displays:

- Valve Open / Closed
- Buzzer Active / Inactive
- Last update time

The buzzer is shown as active when the dashboard determines that the current reading is in an alert state.

---

## 📈 Gas History

The dashboard maintains the latest **30 Firebase readings** in browser memory.

The history is visualized using Recharts.

The graph contains:

- gas level;
- time;
- 0–1023 Y-axis;
- danger-threshold reference line;
- interactive tooltip.

---

## 📝 Status Log

The application maintains the latest **10 status changes**.

Each event contains:

- status;
- gas value;
- system state;
- timestamp;
- alert state.

A new status-log entry is created when the Firebase `Status` value changes.

---

## ☁️ Firebase Connection Status

The navigation bar displays the current Firebase connection state:

- Connecting
- Firebase connected
- Firebase blocked

The application also listens to Firebase's:

```text
.info/connected
```

path to determine the connection state.

---

## 📚 Project Overview Page

The dashboard contains a separate Project Overview page explaining:

- project purpose;
- hardware components;
- Firebase data structure;
- hardware reaction flow;
- technology stack;
- deployment architecture.

---

# ⚠️ Safety Logic

There are currently **two different thresholds** represented in the implementation.

## Dashboard Safety Zones

The visual safety classification in `App.jsx` is:

| Reading | Zone |
|---:|---|
| `0–300` | 🟢 Safe |
| `301–350` | 🟡 Caution |
| `>350` | 🔴 Danger |

Therefore, the dashboard's primary visual danger threshold is **350**.

---

## Alert Detection

The realtime hook uses:

```text
GasValue > 400
OR
Status == "Gas Leak Detected"
```

to mark a reading as an alert.

Therefore, the implementation currently distinguishes between:

```text
Visual danger threshold → 350
Hard alert condition     → >400
                         OR
                         "Gas Leak Detected"
```

This distinction is important.

For real hardware deployment, the sensor calibration, firmware threshold, and dashboard threshold should all be based on one clearly defined and validated safety specification.

---

# 🛠️ Tech Stack

## Frontend

- React 19
- Vite 7
- Tailwind CSS 3
- Framer Motion
- Lucide React
- Recharts

## Realtime Backend

- Firebase Realtime Database
- Firebase Web SDK

## Deployment

Supported configuration is included for:

- Vercel
- Firebase Hosting

---

# 📁 Project Structure

```text
lpg-gas-leakage-dashboard/
│
├── src/
│   ├── App.jsx
│   ├── firebase.js
│   ├── main.jsx
│   ├── styles.css
│   │
│   └── hooks/
│       └── useLpgRealtime.js
│
├── .firebaserc
├── .gitignore
├── firebase.json
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
├── vite.config.js
└── README.md
```

---

## Important Files

### `src/App.jsx`

Main React application.

It contains:

- Landing page
- Dashboard
- Project Overview
- Gas gauge
- Threshold visualization
- Status cards
- Gas history chart
- Status log
- Firebase connection indicator
- Responsive UI

It also contains the dashboard's safety-zone logic.

---

### `src/hooks/useLpgRealtime.js`

This is the main realtime Firebase data layer.

Responsibilities:

1. Connect to Firebase.
2. Monitor Firebase connection state.
3. Listen to `/LPG`.
4. Validate `GasValue`.
5. Convert incoming data to numbers.
6. Clamp readings to 0–1023.
7. Determine alert state.
8. Store the latest 30 readings.
9. Store the latest 10 status events.
10. Handle Firebase permission errors.

---

### `src/firebase.js`

Initializes Firebase and exports the Realtime Database instance.

---

### `src/styles.css`

Contains:

- Tailwind directives;
- global styles;
- dashboard background;
- gauge animation;
- gauge needle animation;
- alert animation.

---

### `firebase.json`

Firebase Hosting configuration.

The production build directory is:

```text
dist/
```

The configuration also rewrites routes to `index.html`.

---

### `vercel.json`

Contains the SPA rewrite required for deployment through Vercel.

---

# 🚀 Getting Started

## Prerequisites

Install:

- Node.js
- npm
- Firebase project with Realtime Database

Check installation:

```bash
node --version
npm --version
```

---

# 📥 Installation

Clone the repository:

```bash
git clone https://github.com/nikhi20-900/lpg-gas-leakage-dashboard.git
```

Enter the project:

```bash
cd lpg-gas-leakage-dashboard
```

Install dependencies:

```bash
npm install
```

---

# 🔥 Firebase Setup

The application initializes Firebase through:

```text
src/firebase.js
```

The current repository is configured for the Firebase project:

```text
lpg-gas-leakage-288b0
```

For your own deployment, use your own Firebase project and Firebase web configuration.

The required Realtime Database structure is:

```text
/LPG
    ├── GasValue
    ├── Status
    └── System
```

Example:

```json
{
  "LPG": {
    "GasValue": 280,
    "Status": "Safe",
    "System": "Valve Open"
  }
}
```

---

# ▶️ Running the Dashboard

Start the development server:

```bash
npm run dev
```

The configured Vite server runs at:

```text
http://127.0.0.1:5173/
```

The dashboard requires valid Firebase data to display live readings.

If Firebase does not contain a valid numeric `GasValue`, the application shows a waiting state instead of generating fake values.

---

# 🏭 Production Build

Build the application:

```bash
npm run build
```

The production files are generated in:

```text
dist/
```

Preview the production build:

```bash
npm run preview
```

---

# ☁️ Deployment

## Vercel

The repository already contains:

```text
vercel.json
```

with a SPA rewrite.

Build the application:

```bash
npm install
npm run build
```

Then deploy the project through Vercel.

---

## Firebase Hosting

The repository also contains:

```text
firebase.json
```

which is configured to serve:

```text
dist/
```

After installing and authenticating with the Firebase CLI:

```bash
npm run build
```

Then deploy the Firebase Hosting output.

---

# 🔄 Complete Data Flow

## Normal Condition

```text
MQ-2
  │
  ▼
ESP8266
  │
  ├── GasValue = 250
  ├── Status = "Safe"
  └── System = "Valve Open"
  │
  ▼
Firebase /LPG
  │
  ▼
React Listener
  │
  ├── Gauge → 250
  ├── Status → Safe
  ├── Valve → Open
  ├── Buzzer → Inactive
  ├── Chart → Add reading
  └── Log → Add status change
```

---

## Leak Condition

```text
MQ-2 detects elevated gas
          │
          ▼
       ESP8266
          │
          ├── Buzzer ON
          ├── Servo → Valve Closed
          ├── GasValue increases
          ├── Status = "Gas Leak Detected"
          └── System = "Valve Closed"
          │
          ▼
     Firebase /LPG
          │
          ▼
    React Dashboard
          │
          ├── 🚨 Gas Leak Detected
          ├── Valve → Closed
          ├── Buzzer → Active
          ├── Chart → Add reading
          └── Status Log → Add event
```

---

# 🧠 Important Implementation Details

## No Fake Readings

The dashboard deliberately does not generate simulated sensor values.

If Firebase is empty or invalid, it displays:

```text
Waiting for live sensor data
```

This ensures that the dashboard does not falsely indicate that the physical system is working.

---

## Input Normalization

Incoming `GasValue` data is:

1. converted into a number;
2. checked for validity;
3. rounded;
4. restricted to 0–1023.

Conceptually:

```text
normalizedValue =
    clamp(
        round(Number(GasValue)),
        0,
        1023
    )
```

---

## Realtime Updates

The application uses Firebase's realtime `onValue` listener.

It does not repeatedly poll the database.

Whenever `/LPG` changes, the dashboard receives the updated state.

---

## Browser-Side History

The application stores:

- latest 30 readings;
- latest 10 status changes.

These are stored in React state.

They are **not persistent historical records in Firebase**.

Therefore, refreshing the browser clears the locally accumulated chart and status history until new Firebase readings arrive.

---

## Hash-Based Routing

The application uses lightweight hash routing:

```text
/
/#/dashboard
/#/overview
```

No React Router dependency is used.

---

# ⚠️ Limitations

## Embedded Firmware Is Not Included

The repository does not contain the ESP8266/Arduino firmware responsible for:

- reading the MQ-2;
- controlling the buzzer;
- controlling the MG996R;
- publishing Firebase values.

The dashboard assumes another system is already publishing the required Firebase data.

---

## Sensor Calibration

The dashboard treats the incoming value as a 0–1023 sensor scale.

The browser does not perform actual MQ-2 calibration or validated physical gas-concentration conversion.

For production use, sensor calibration must be handled appropriately at the hardware/system level.

---

## Temporary History

Only the latest:

```text
30 readings
10 status events
```

are maintained in browser memory.

There is currently no persistent analytics database.

---

## Threshold Consistency

The current implementation contains:

```text
Visual danger zone: >350
Alert condition:    >400
                    OR
                    Gas Leak Detected
```

A production implementation should establish one validated safety policy and use it consistently across the firmware and dashboard.

---

## Firebase Permissions

If Firebase Realtime Database rules deny reads, the dashboard cannot retrieve sensor data.

The UI detects this condition and displays a Firebase permission error.

---

# 🔮 Future Improvements

Possible future extensions include:

- Persistent gas history in Firebase
- Daily/weekly/monthly analytics
- User authentication
- Role-based access
- Email alerts
- SMS alerts
- Telegram alerts
- Multiple sensor/device support
- Device heartbeat monitoring
- Last-seen device state
- Offline detection
- Configurable thresholds
- Emergency event timeline
- Firmware source in the same repository
- Hardware wiring diagrams
- Automated tests
- Environment-based Firebase configuration
- MQ-2 calibration tooling
- Device health monitoring
- Mobile-responsive emergency notification workflow

---

# 🛡️ Safety Notice

This project is an **educational IoT prototype/dashboard**.

It should not be treated as certified gas-safety equipment or as a replacement for professionally engineered LPG detection and shutoff systems.

MQ-series sensors require appropriate calibration and their readings can depend on environmental and hardware conditions.

A real deployment should use:

- validated sensors;
- appropriate electrical design;
- gas-rated components;
- safe mechanical shutoff mechanisms;
- professionally reviewed safety logic.

**Do not intentionally release LPG gas in an unsafe or uncontrolled environment for testing.**

---

# 📄 License

No explicit open-source license is currently declared in the repository.

If this project is intended for public reuse, add an appropriate license file before representing it as an open-source project.

---

# 👨‍💻 Author

**Nikhil Chhetri**

GitHub:  
https://github.com/nikhi20-900

Repository:  
https://github.com/nikhi20-900/lpg-gas-leakage-dashboard

---

# 🧩 Project Summary

```text
PHYSICAL WORLD
       │
       ▼
  MQ-2 SENSOR
       │
       ▼
 ESP8266 NODEMCU
       │
       ├──────────────► BUZZER
       │
       ├──────────────► MG996R SERVO
       │
       ▼
FIREBASE REALTIME DATABASE
       │
       ▼
 REACT + VITE DASHBOARD
       │
       ├── Live Gas Gauge
       ├── Safety Status
       ├── Valve State
       ├── Buzzer State
       ├── Gas History
       └── Status Log
```

The result is a web-based monitoring interface for an LPG leakage detection and automatic-shutoff prototype, providing a realtime view of sensor readings and system state.
