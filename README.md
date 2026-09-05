# Tier 1: The "Wireframe / Minimalist" Agent Profile

A stylized 2.5D isometric pixel-art interface and real-time model scratchpad designed for low-end mobile and web hardware with **zero GPU strain**.

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Architecture: Canvas 2D](https://img.shields.io/badge/Render-HTML5_Canvas_2D-blue.svg)](#zero-gpu-render-architecture)
[![Security: Audited](https://img.shields.io/badge/Security-Public_Audited-cyan.svg)](#security-audit--google-gemini-protection)

---

## 🎮 Visual Metaphor & Representation

- **Isometric Workspace**: Top-down 2.5D pixel-art aesthetic inspired by early *The Sims* and Game Boy Advance interfaces.
- **Agent Sprite**: A 2D pixel-art agent typing at a wooden workstation with a CRT terminal monitor, coffee mug, and desk lamp.
- **Alert States**:
  - 💧 **Animated Sweat Drop**: Appears over the sprite when tokenization fragmentation, high entropy, or context breakdown occurs.
  - 🔴 **Overhead Buffer Gauge**: Dynamic pixel progress bar tracking token capacity, flashing red when approaching overflow limits.
  - 📄 **Stack of Flat Papers**: Realistic isometric paper sheets pile up dynamically on the desk (from 1 to 35+ sheets) as tokens stream and when breakdowns occur.
- **Model Scratchpad**: Tapping the desk opens a flat, scrollable inspector showing raw subword tokens, token IDs, log probabilities, and softmax candidate distribution bar charts.

---

## ⚡ Lightweight & Older Hardware Optimizations

- **Zero GPU Cost**: Handled 100% by HTML5 Canvas 2D with integer pixel snapping. No WebGL shader compilation, no 3D mesh overhead, zero GPU heat.
- **Low-Power / Eco Mode**: Built-in 30 FPS throttle toggle reduces CPU usage by over 50% on legacy smartphones, netbooks, and older laptops.
- **Background Tab Throttling**: Automatically pauses rendering loops when the browser tab is hidden using the `visibilitychange` API.
- **Touch-Friendly Controls**: Minimum 44px touch targets on all primary interactive buttons for older mobile touchscreens.
- **Keyboard Navigation**:
  - `Space`: Stream / Pause tokens
  - `S` or `→`: Advance 1 token step
  - `D`: Tap desk / Toggle scratchpad
  - `R`: Reset papers and buffer

---

## 🛡️ Security Audit & Google / Gemini Protection

This repository has been audited for safe public GitHub hosting:

1. **No Hardcoded Secrets**:
   - Zero API keys, tokens, passwords, or credentials exist in the source code or git history.
   - `.env.example` contains only placeholder values (`"MY_GEMINI_API_KEY"`).
2. **Server-Side API Isolation**:
   - All communication with the `@google/genai` SDK is confined strictly to the backend Express server (`server.ts`).
   - The Gemini API key (`process.env.GEMINI_API_KEY`) is never exposed, returned in network responses, or prefixed with `VITE_`.
3. **Error Sanitization**:
   - Backend error handlers sanitize API exceptions before sending them to clients, preventing accidental leakage of internal stack traces, system paths, or environment variables.
4. **Hardened `.gitignore`**:
   - Blocks `.env*`, `.secrets/`, `*.pem`, `*.key`, `*.cert`, `dist/`, and build artifacts from ever being committed to GitHub.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional for Live Gemini)
If you want to use live Gemini 3.8 Flash streaming in addition to the simulated token engine:
```bash
cp .env.example .env
# Add your GEMINI_API_KEY inside .env
```
*(The application works out-of-the-box in local simulation mode even without an API key!)*

### 3. Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Production Build & Start
```bash
npm run build
npm start
```

---

## 📄 License

This project is licensed under the permissive [MIT License](LICENSE) — free for personal, educational, and commercial use.
