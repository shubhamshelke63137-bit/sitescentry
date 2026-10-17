# SiteSentry AI – Smart Construction Site Safety Monitoring System
> **Hardware-Free Computer Vision Safety Monitoring**  
> *Phone Camera Capture + Laptop AI Dashboard + WebRTC Live P2P Streaming*

---

## 🌟 Overview

**SiteSentry AI** is a complete, full-stack web application designed for construction site safety monitoring without requiring physical IoT sensors, RFID badges, Arduino microcontrollers, or CCTV hardware. 

The system operates in a **dual-device configuration**:
1. **Mobile Smartphone (Transmitter)**: Acts as a handheld or mounted wireless camera. Captures live high-definition video of the construction site using browser camera permissions and streams it peer-to-peer to your laptop via WebRTC.
2. **Laptop / PC (Intelligence Hub & Dashboard)**: Receives the live stream, runs AI computer vision object detection in real time, computes **person-to-PPE spatial containment** (verifying hard hats on heads and safety vests on torsos), logs violations, triggers audible hazard alarms, and exports official HSE compliance reports.

Inspired by the design of professional industrial monitoring suites (like `sitesentry-ai-constr-lni9.bolt.host`).

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas 2D Overlay Rendering.
- **Backend**: Node.js & Express (`server.ts`) with Vite middleware.
- **P2P Video Streaming**: WebRTC with dual WebSocket (`/ws-signaling`) and REST HTTP signaling fallback + Google STUN servers.
- **AI Vision Engine**:
  - **Server-Side AI**: Gemini 3.8 Flash Vision (`@google/genai`) providing normalized 0–1000 bounding boxes and PPE containment heuristics.
  - **Custom Model Support**: Direct proxy endpoint (`/api/custom-model-proxy`) for local Python FastAPI / Flask YOLOv8 models.
  - **Offline Benchmark Mode**: Pre-evaluated ground-truth datasets for testing when offline or without an API key.
- **Audio Synthesizer**: Web Audio API dual-frequency hazard siren (no external sound files required).
- **Pairing & Networking**: Dynamic QR Code generation (`qrcode`) with session token verification.

---

## 🚀 Step-by-Step Setup in VS Code (Local Machine)

### Prerequisites
1. **Node.js** (v18 or higher): Download from [nodejs.org](https://nodejs.org/).
2. **VS Code**: Download from [code.visualstudio.com](https://code.visualstudio.com/).
3. A smartphone (Android or iOS) with Google Chrome, Safari, or Brave.

### Step 1: Open Project in VS Code
Open your terminal in the project directory:
```bash
cd sitesentry-ai
code .
```

### Step 2: Install Dependencies
Open the integrated terminal (`Ctrl + \`` or `Cmd + \``) and run:
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a file named `.env` in the root folder:
```env
# Your Gemini API Key from Google AI Studio (https://aistudio.google.com/)
GEMINI_API_KEY="AIzaSy..."

# Port configuration (default 3000)
PORT=3000
```

### Step 4: Run the Development Server
```bash
npm run dev
```
You will see:
```
[SiteSentry] Full-Stack Server + WebRTC Signaling active on http://0.0.0.0:3000
```
Open **http://localhost:3000** in your laptop browser!

---

## 📱 How to Connect Your Phone Camera to Your Laptop

### The W3C Browser Security Requirement (Important for College Viva!)
Mobile browsers (Google Chrome on Android, Safari on iOS) enforce the W3C security standard: **Camera access (`navigator.mediaDevices.getUserMedia`) is strictly restricted to Secure Contexts (`HTTPS` or `localhost`)**. 

To connect your phone camera, choose one of these two practical methods:

### Method A: Cloud HTTPS Deployment (Easiest & Recommended)
When running on Google AI Studio or deployed to any HTTPS cloud host (Cloud Run, Render, Vercel, Railway):
1. Open the dashboard on your laptop.
2. Click **"Connect Phone Cam"** in the sidebar. A QR code and pairing link will appear.
3. Open your Android phone camera or Google Lens and scan the QR code.
4. The link will open in Chrome on your phone.
5. Tap **"Start Broadcasting Camera"**.
6. When Chrome asks *"SiteSentry wants to use your camera"*, tap **"Allow"**.
7. The rear camera turns on and streams directly to your laptop dashboard via WebRTC!

### Method B: Local Testing with `ngrok` (Free HTTPS Tunnel)
If running locally on your laptop:
1. In a second terminal in VS Code, install and run `ngrok`:
   ```bash
   npx ngrok http 3000
   ```
2. Ngrok provides a free HTTPS forwarding URL, e.g.:
   `https://a1b2-c3d4.ngrok-free.app`
3. Open that HTTPS URL on your laptop and scan the pairing QR code with your phone!

### Method C: Testing on Single Machine (Self-Pairing)
1. On your laptop dashboard, navigate to **"Connect Phone Cam"**.
2. Click **"Test in Separate Window (Self-Pair)"**.
3. A mobile-sized window will open acting as the phone camera transmitter, while the main window acts as the dashboard receiver.

---

## 🧠 Reliable Person-to-PPE Association Algorithm

A frequent mistake in student projects is naive object counting (e.g. *“2 people detected, 1 helmet detected”*), which fails because the system cannot identify **which** worker is in violation.

SiteSentry implements **Spatial Containment & Intersection-over-Union (IoU) Heuristics**:
1. For each detected person bounding box $[Y_{min}, X_{min}, Y_{max}, X_{max}]$:
2. **Hard Hat Rule**: The head region is defined as the top 30% of the person's bounding box:
   $$Y_{min}^{helmet} \ge Y_{min}^{person} - \delta \quad \text{and} \quad Y_{max}^{helmet} \le Y_{min}^{person} + 0.35 \times \text{Height}^{person}$$
   $$X_{center}^{helmet} \in [X_{min}^{person}, X_{max}^{person}]$$
3. **Safety Vest Rule**: The torso region is defined as 25% to 80% of the person's height:
   $$Y_{min}^{vest} \ge Y_{min}^{person} + 0.20 \times \text{Height}^{person} \quad \text{and} \quad Y_{max}^{vest} \le Y_{min}^{person} + 0.80 \times \text{Height}^{person}$$
4. If a person lacks a helmet in their head region, a **Missing Hard Hat** violation is triggered.
5. If both items are missing, the status escalates to **CRITICAL VIOLATION** and triggers the dual-tone hazard siren.

---

## 🏗️ Custom YOLOv8 Training Pipeline (Python)

If you wish to train your own custom weights instead of using the built-in Gemini Vision engine:
1. Open the **"Model Training Lab"** tab in the dashboard.
2. Follow the instructions to download the **Roboflow Construction Site Safety (Hardhat-Vest-Worker)** dataset.
3. Run the provided `train_yolov8_ppe.py` script:
   ```bash
   pip install ultralytics roboflow opencv-python
   python train_yolov8_ppe.py
   ```
4. Start the included `fastapi_server.py`:
   ```bash
   python fastapi_server.py
   ```
5. Enter `http://localhost:8000/predict` in **Settings > Custom Model Inference URL**.

---

## 🔒 Privacy & Zero-Cloud Guarantee

- **Peer-to-Peer Streaming**: Video frames travel directly between your phone and laptop over WebRTC via local Wi-Fi and STUN hole-punching.
- **Ephemeral RAM Processing**: Analyzed frames are processed in server memory for milliseconds to extract coordinates and are immediately discarded.
- **Zero Cloud Recording**: No continuous video recordings are saved to any cloud storage or database without explicit user request.
- **Hardware Release**: When you stop monitoring or disconnect, camera tracks are immediately stopped via `track.stop()`.

---

## 📋 Features Checklist

- [x] Full-screen laptop dashboard with dark navy & safety-orange aesthetic.
- [x] Responsive sidebar navigation (Dashboard, Live Monitor, Phone Pair, Site Map, Alerts, Reports, Training Lab, Settings).
- [x] Mobile camera broadcaster interface with rear camera preference and torch toggle.
- [x] Genuine WebRTC video streaming with dual WebSocket and REST signaling.
- [x] Real AI object detection with bounding boxes, labels, and confidence percentages.
- [x] Person-to-PPE spatial containment rules for helmets and vests.
- [x] Interactive site blueprint map (Main Gate, Medical Camp, Emergency Exit, Safety Office, Zones).
- [x] Live safety alerts feed with **Acknowledge** and **Resolve** buttons.
- [x] Downloadable CSV HSE compliance audit reports.
- [x] Web Audio API hazard siren synthesizer with mute toggle.
- [x] Benchmark test gallery and custom image/video upload support.
