# GLUE 🚀

> **Hackathon Project by Team AURA**

---

## 👥 Team AURA Roster

| Member | Role / Focus | GitHub Profile |
| :--- | :--- | :--- |
| **Vrishin Ram** (Lead) | Security Analyst | [@Vrishinram](https://github.com/Vrishinram) |
| **TinFox213** | Fullstack / Core | [@TinFox213](https://github.com/TinFox213) |
| **Siva Shankar** | UI/UX Designer | [@SIVASHANKAR-CODE](https://github.com/SIVASHANKAR-CODE) |
| **Vaishnavi Ganesan** | Researcher | [@vaishnaviganesan2006-hue](https://github.com/vaishnaviganesan2006-hue) |
| **Yogendra Sai** | Application Tester | [@yogendrasai19-del](https://github.com/yogendrasai19-del) |

---

## 🎯 About Project IGLOO

*Add your hackathon project problem statement, vision, and core solution here.*

### ✨ Key Features
- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3

---

## 🛠️ Tech Stack

- **Backend:** Node.js & Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **AI / Vision:** Qwen 2.5-VL via OpenRouter (`qwen/qwen-2.5-vl-72b-instruct`)
- **Frontend:** *(To be configured)*

---

## 🚀 Quick Start for Team Members

### 1. Clone the repository & install dependencies
```bash
git clone https://github.com/Vrishinram/GLUE.git
cd GLUE
npm install
```

### 2. Configure Environment & API Keys
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your shared `MONGODB_URI` and `OPENROUTER_API_KEY` inside `.env`.

Test database & vision capabilities:
```bash
npm run test-db       # Verifies MongoDB Atlas
npm run test-vision   # Verifies Qwen Vision Object Detection
```

Start the development server:
```bash
npm run dev
```
- Health check: `http://localhost:5000/api/health`
- Detect image by URL: `POST http://localhost:5000/api/vision/detect-url`
- Detect image by Upload: `POST http://localhost:5000/api/vision/detect-upload`

### 3. Check out your own branch before making changes
Never push directly to `main`! Always work on a feature branch:
```bash
# Update local main
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feat/your-feature-name
```

### 3. Commit and Push
```bash
git add .
git commit -m "feat: describe what you built"
git push origin feat/your-feature-name
```

### 4. Create a Pull Request (PR)
1. Go to [github.com/Vrishinram/GLUE](https://github.com/Vrishinram/GLUE).
2. Click **Compare & pull request**.
3. Tag your teammates to review and merge into `main`!

---

## 📜 Team Guidelines
Refer to [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming conventions and conflict-resolution rules.
