# Team AURA - Hackathon Collaboration Guide 🤝

To keep our team moving fast without stepping on each other's toes or breaking working code, follow these quick guidelines:

---

## 🌿 1. Branch Naming Convention
Always create a branch from latest `main`:

| Type | Branch Pattern | Example |
| :--- | :--- | :--- |
| **New Feature** | `feat/<name>-<feature>` | `feat/siva-auth` |
| **Bug Fix** | `fix/<name>-<bug>` | `fix/vaishnavi-api-error` |
| **UI/Styling** | `ui/<name>-<component>` | `ui/tinfox-landing-page` |
| **Documentation** | `docs/<description>` | `docs/api-contracts` |

---

## ⚡ 2. Daily Hackathon Workflow

### Step 1: Start from fresh `main`
```bash
git checkout main
git pull origin main
```

### Step 2: Make your changes on your branch
```bash
git checkout -b feat/your-feature
# Write your code...
```

### Step 3: Check git status before committing
```bash
git status
# Make sure you are NOT committing .env files, node_modules, or credentials!
git add .
git commit -m "feat: add user authentication form"
git push -u origin feat/your-feature
```

### Step 4: Open a Pull Request (PR)
- Open a PR into `main` on GitHub.
- Request a review from at least one teammate on WhatsApp/Discord/Slack.
- Once approved, merge into `main` using **Squash and merge** or **Merge commit**.

---

## ⚠️ 3. Handling Conflicts Easily
If someone merged code before you and your branch is outdated:
```bash
git checkout feat/your-feature
git fetch origin
git merge origin/main
# If there are conflicts, open the files in VS Code, click "Accept Current" or "Accept Incoming", then:
git add .
git commit -m "chore: resolve merge conflicts with main"
git push origin feat/your-feature
```

---

## 🔒 4. Crucial Security Rule
**NEVER commit API keys or passwords directly into the code.**
Always use `.env` files (which are already ignored by `.gitignore`). Share `.env.example` templates instead!
