# StudentPulse AI 🎓⚡
> **AI-Powered Student Success, Skill-Gap Analysis & Career Readiness Platform**  
> KIET Group of Institutions · AI Fundamentals & Python Programming · MSE-2 Prototype

---

## 👥 Team

| Name | Enrollment | Role |
|---|---|---|
| **Amarjeet Kumar** | 2628MCA0069 | Team Leader |
| Akhilesh Chaubey | 2628MCA0206 | Full-Stack Dev |
| Arpit Tiwari | 2628MCA0240 | Backend Dev |
| Ankit Pathak | 2628MCA0256 | Data & Analytics |
| Archana Tiwari | 2628MCA0030 | UI/UX & Testing |

---

## 🏗️ MSE-2 Architecture

```
StudentPulse-AI/
├── backend/
│   ├── app.py              # Flask factory + SPA serving
│   ├── config.py           # Environment config
│   ├── db.py               # SQLite schema + KIET seed data
│   ├── auth.py             # PyJWT 24h tokens + decorators
│   ├── services/
│   │   ├── readiness_engine.py  # Pure Python scoring (no API needed)
│   │   └── ai_service.py        # Gemini 4 Hydrogen → AGY → Groq → Fallback
│   └── routes/
│       ├── auth_routes.py       # Register, Login, /me
│       ├── student_routes.py    # Context, Evidence, Plan, Progress
│       └── admin_routes.py      # Cohort KPIs, Skill-Gap, CSV Export
├── frontend/
│   ├── index.html          # Responsive SPA (Tailwind, Chart.js 4.4, Lucide)
│   └── js/
│       ├── api.js           # JWT fetch client + error alerts
│       ├── student.js       # 4-view student flow + radar/bar/line charts
│       └── admin.js         # Faculty cohort analytics + CSV export
└── tests/
    └── test_api.py          # 28 tests (scoring, AI fallback, auth, API)
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure environment (optional — works offline without keys)
```bash
cp .env.example .env
# Edit .env to add GEMINI_API_KEY for live AI plan generation
```

### 3. Run the server
```bash
python -m backend.app
```
Open: **http://localhost:5000**

### 4. Demo Login (1-click)
- **Student Demo:** `amarjeet.2628MCA0069@kiet.edu` / `Student@123`
- **Faculty Demo:** `faculty@kiet.edu` / `Faculty@KIET2024`

---

## 📋 5-Step User Journey

| Step | Description |
|------|-------------|
| **1. Create Profile** | Register with @kiet.edu email or use 1-click demo |
| **2. Enter Context** | Set TargetRole, DailyStudyHours, FocusArea; log assessments, projects, certs |
| **3. Get AI Recommendation** | Gemini 4 Hydrogen generates readiness score, skill-gap report, 90-day roadmap |
| **4. Review & Modify Plan** | Edit, reorder, add custom tasks; set priorities and target dates |
| **5. Track Progress** | Daily streak, active days, weekly bar chart, score trend |

---

## 🔢 Readiness Scoring Engine

| Component | Weight | Description |
|---|---|---|
| Academic & Assessment Index | **35%** | Weighted avg of exam (1.0x), quiz (0.6x), assignment (0.4x) scores |
| Skill Alignment Index | **40%** | Keyword match of tech stack vs role benchmark matrix |
| Project & Practical Evidence | **25%** | Complexity weights (Beginner 0.5× → Advanced 1.5×) + cert bonus |

**Readiness Tiers:** `Industry Ready` (≥80) · `Developing` (≥60) · `Needs Foundation` (<60)

---

## 🤖 AI Engine Priority Chain

```
Gemini 4 Hydrogen (google-genai Interactions API)
  ↓ timeout or no key
AGY SDK Agent (google-antigravity)
  ↓ timeout or no key
Groq API (llama3-8b-8192)
  ↓ timeout or no key
Deterministic Python Fallback ← always works offline
```

**5-second hard timeout** via daemon threads. 100% offline reliability for MSE-2.

---

## 🎓 4-Screen Demo Architecture

| View | Description |
|---|---|
| **Home & Login** | Hero, feature cards, 1-click demo buttons, @kiet.edu auth |
| **Profile & Evidence** | Context form + Assessments / Projects / Certifications locker |
| **AI Readiness & Plan** | Score card, 5-axis radar, skill chips, 4-milestone editable roadmap, flashcards |
| **Progress & Cohort** | Streak/active days, weekly bar chart, score trend + Faculty cohort table & CSV |

---

## 🧪 Running Tests

```bash
python -m pytest tests/ -v
# 28 passed (scoring engine × 9, AI fallback × 8, Flask API × 11)
```

---

## 🔧 Non-Functional Attributes

| Attribute | Implementation |
|---|---|
| **Robustness** | @kiet.edu validation, parameterized SQL (`?`), AI timeout + fallback |
| **Modifiability** | Layered: Presentation / Routes / Services / DB |
| **Scalability** | Multi-user SQLite (portable to PostgreSQL/SQL Server) |
| **Buildability** | Standard pip install, zero build steps, CDN-based frontend |

---

## 🗺️ ESE Roadmap (Post MSE-2)

- [ ] Migrate SQLite → PostgreSQL (production scale)
- [ ] Add OAuth / KIET SSO login
- [ ] Implement real-time WebSocket progress updates
- [ ] Add peer comparison / cohort percentile ranking
- [ ] Mobile PWA with offline support
- [ ] Resume parsing integration (PDF → skills extraction)
- [ ] Scheduled weekly AI plan refresh via email digest

---

*Built with ❤️ by the KIET MCA 2026 team · Powered by Gemini 4 Hydrogen + Google Antigravity SDK*
