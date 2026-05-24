# ⚡ PulseGuard AI

> **AI-Powered Infrastructure Monitoring & Incident Response Dashboard**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Claude AI](https://img.shields.io/badge/Claude-Sonnet_4-7C3AED?style=flat-square)](https://anthropic.com)
[![Recharts](https://img.shields.io/badge/Recharts-2.x-22B5BF?style=flat-square)](https://recharts.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Built for AI Hackathon for Builders — 23–24 May 2025**

---

## 🚀 Live Demo

> Open `PulseGuardAI.jsx` as a React artifact in [Claude.ai](https://claude.ai) — it runs entirely in the browser, no setup needed.

---

## 🧠 What is PulseGuard AI?

PulseGuard AI is a **real-time infrastructure monitoring dashboard** that uses Claude AI to detect, diagnose, and help resolve API incidents — before they escalate into outages.

Think of it as a **SOC (Security Operations Center) + SRE Command Room**, powered by AI, in your browser.

---

## ✨ Features

### 📊 Live Dashboard
- Real-time uptime, latency, request rate, and error rate across 6 services
- Animated health gauge (0–100 score)
- Live area/bar charts updating every 5 seconds
- Service health table with per-region status

### 🤖 AI Chat Assistant
- Ask natural language questions: *"Why is Payment API failing?"*
- Claude responds with root cause analysis and actionable fixes
- Full conversation history with streaming typewriter effect
- Quick-action suggestion chips for common queries

### 🔬 AI Analyzer
- Paste any log snippet or error message
- Claude identifies patterns, severity, and probable root cause
- Returns structured diagnosis with confidence score

### 🧪 API Testing Panel
- Fire GET/POST/PUT/DELETE/PATCH requests with custom headers and body
- Real DNS → Connect → Send → Response animation
- **Auto-triggers Claude AI diagnosis** when response is 4xx/5xx
- Shows headers, body, latency, and status with color-coded severity

### 🛡️ AI Auto-Healing
- One-click remediation actions: Restart, Rollback, Scale, Clear Cache, Restart DB, Rebalance Load
- After 2+ actions, Claude generates an AI Recovery Summary
- Visual execution state (idle → loading → complete)

### 📅 Incident Timeline
- Cinematic replay of a real-world Payment API outage (#INC-2847)
- Chronological event log with icons, timestamps, and descriptions
- From deployment → spike → pool exhaustion → alert → resolution

### 📢 Explain Like I'm Not an Engineer
- Select any technical incident
- Claude rewrites it in plain English for CEOs, PMs, and customers
- No jargon — just clear, honest business language

### 🗺️ Global Infrastructure Map
- 6 world regions visualized with live health scores
- Animated ping on critical nodes
- Color-coded by health status (green/yellow/red)
- Load percentage per region

### 🖥️ Live Log Terminal
- Streaming log output (tail -f style)
- Color-coded by level: ERROR (red), WARN (yellow), INFO (green)
- Error/warn counters in the terminal header

### 🔔 Alerts Center
- Filterable alert feed (All / Critical / High / Medium / Low)
- Per-alert Investigate and Acknowledge actions
- Active incident pulse animation

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (single JSX file) |
| Charts | Recharts (AreaChart, BarChart, LineChart, RadialBarChart) |
| AI | Anthropic Claude Sonnet 4 (`claude-sonnet-4-20250514`) |
| Fonts | Exo 2, Rajdhani, JetBrains Mono (Google Fonts) |
| Styling | Inline styles + injected CSS (no build step) |
| State | React hooks (useState, useEffect, useRef, useCallback) |

---

## 🤖 AI Integration Details

PulseGuard AI makes **4 distinct Claude API calls**:

```
1. Chat Assistant       → /v1/messages  (conversational, with system prompt)
2. API Tester Diagnosis → /v1/messages  (triggered on 4xx/5xx responses)
3. Auto-Heal Summary    → /v1/messages  (after 2+ healing actions)
4. Explain Page         → /v1/messages  (incident → plain English translation)
```

All responses use a **streaming typewriter effect** for a polished UX.

---

## 🚀 Running the Project

### Option 1: Claude.ai Artifact (Easiest)
1. Open [claude.ai](https://claude.ai)
2. Paste the contents of `PulseGuardAI.jsx` and ask Claude to render it as a React artifact
3. Click **Enter Dashboard** on the landing page

### Option 2: Local React App
```bash
# Create a new React app
npx create-react-app pulseguard
cd pulseguard

# Install dependencies
npm install recharts

# Replace src/App.js with PulseGuardAI.jsx content
# Run
npm start
```

### Option 3: Vite (Faster)
```bash
npm create vite@latest pulseguard -- --template react
cd pulseguard
npm install recharts
npm run dev
```

---

## 📁 Project Structure

```
pulseguard-ai/
├── PulseGuardAI.jsx        # Complete single-file React application
├── README.md               # This file
└── LICENSE                 # MIT License
```

---

## 🎯 Problem Statement

Modern engineering teams are drowning in alerts, logs, and dashboards. When something breaks at 2 AM:
- Dashboards show *what* is broken — not *why*
- Engineers spend 20–40 minutes diagnosing before fixing
- Non-technical stakeholders get no usable information

**PulseGuard AI** solves this by putting an AI co-pilot directly in the monitoring dashboard — one that can explain, diagnose, and guide recovery in real time.

---

## 🔮 Roadmap

- [ ] Webhook integrations (PagerDuty, Slack, OpsGenie)
- [ ] Multi-tenant support with team workspaces
- [ ] Historical incident database with AI pattern detection
- [ ] Voice alerts via browser TTS
- [ ] Custom threshold rules with AI-suggested baselines
- [ ] Export incident reports as PDF

---

## 👩‍💻 Author

**Astha Mosmi**
- GitHub: [@asthamosmi-arch](https://github.com/asthamosmi-arch)
- Email: asthamosmi@gmail.com
- ORCID: [0009-0002-3572-2997](https://orcid.org/0009-0002-3572-2997)
- College: Maitreyi College, Delhi University

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<div align="center">
  <sub>Built with ❤️ and a lot of ☕ for the AI Hackathon for Builders 2025</sub>
</div>
