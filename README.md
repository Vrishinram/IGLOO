# 🏔️ IGLOO — Intelligent Gated-community Living & Operations Orchestrator

A modern **Progressive Web App (PWA)** for housing society management, featuring AI-powered maintenance triage, transparent financial tracking, and digitized visitor gate management.

> Built for **AppBlitz Buildathon** — 24-hour hackathon MVP

---

## 🌟 Key Features

### 🔧 Smart Maintenance System
- AI-powered issue triage with automatic category, priority, and cost estimation
- Full ticket lifecycle: OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
- Resident satisfaction rating system
- Dual-tier AI: Google Gemini (Primary) → OpenRouter Gemma (Fallback) → Local Heuristics (Safety Net)

### 💰 Transparent Society Treasury
- Real-time balance tracking with monthly inflow/outflow
- AI financial anomaly detection and audit reports
- Simulated UPI payment for maintenance dues
- Category-wise expense breakdown with visual charts

### 🚪 Digitized Visitor Management
- 6-digit pass code generation with QR codes
- Guard verification terminal with instant lookup
- Real-time visitor tracking (inside/checked-out)
- WhatsApp sharing for visitor passes

### 👥 4 User Roles
| Role | Persona | Access |
|------|---------|--------|
| Admin | Rajesh Sharma (President) | Full management dashboard |
| Resident | Priya Patel (Flat B-402) | Tickets, finances, visitors |
| Security | Bahadur Singh (Main Gate) | Gate terminal, visitor log |
| Technician | Kumar (Electrician) | Assigned task management |

### ⚡ One-Click Demo Access
Instant login as any role — no signup required. Perfect for hackathon evaluation.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS (Dark Emerald Theme) |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (M0 Free Tier) |
| AI Primary | Google AI Studio (Gemini 2.0 Flash) |
| AI Fallback | OpenRouter (Gemma 4 26B) |
| Auth | JWT + RBAC |
| PWA | Web App Manifest + Service Worker |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (M0 free tier)

### 1. Clone & Install
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment
Create `server/.env`:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your-jwt-secret
GEMINI_API_KEY=your-google-ai-studio-key
OPENROUTER_API_KEY=your-openrouter-key
```

### 3. Seed Database
```bash
cd server
npm run seed
```

### 4. Start Development
```bash
# Terminal 1: Start backend (port 5000)
cd server
npm run dev

# Terminal 2: Start frontend (port 3000)
cd client
npm run dev
```

### 5. Open Browser
Navigate to `http://localhost:3000` and click any demo persona card to start!

---

## 📁 Project Structure
```
igloo-pwa/
├── client/                 # React PWA Frontend
│   ├── public/             # PWA assets (manifest, icons)
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── context/        # React Context (Auth)
│       ├── pages/          # Route pages by role
│       ├── services/       # API client
│       └── types/          # TypeScript interfaces
├── server/                 # Express API Backend
│   ├── config/             # Database connection
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth, RBAC, errors
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API route definitions
│   ├── services/           # AI orchestration
│   └── utils/              # Seed script
└── vercel.json             # Deployment config
```

---

## 🎯 Society: Silver Oak Heights
- **20 Units** across Blocks A & B
- **4 Demo Personas** with pre-seeded data
- **6 Maintenance Tickets** in various states
- **10 Treasury Records** (dues + expenses)
- **4 Visitor Passes** (including demo pass `IG-7824`)
- **2 Society Notices**

---

## 📄 License
Built with ❤️ for AppBlitz Buildathon 2026
