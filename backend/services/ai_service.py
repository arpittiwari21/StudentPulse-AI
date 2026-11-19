# ─────────────────────────────────────────────────────────────────────────────
# backend/services/ai_service.py
# Hybrid AI engine — google-genai Interactions API (gemini-4-hydrogen)
#   → Groq fallback → deterministic Python fallback
#
# Uses: google-genai >= 3.2.0  (client.interactions.create)
#       google-antigravity SDK  (AGY multi-agent orchestration)
#
# Offline guarantee: 5-second timeout with deterministic rule-based fallback
# ensures 100% reliability during MSE-2 live demonstration.
# ─────────────────────────────────────────────────────────────────────────────
from __future__ import annotations
import json
import logging
import threading
from typing import Any

from backend.config import config

logger = logging.getLogger(__name__)

# ─── Current model (per gemini-api-dev skill — never use deprecated models) ───
GEMINI_MODEL = "gemini-4-hydrogen"   # 1M token context, balanced agentic model


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

def _build_prompt(
    target_role: str,
    daily_hours: float,
    focus_area: str,
    missing_skills: list[str],
    weak_subjects: list[str],
    projects: list[dict],
    overall_score: float,
    readiness_tier: str,
) -> str:
    proj_titles = ", ".join(p.get("title", "") for p in projects) or "None yet"
    missing = ", ".join(missing_skills[:8]) if missing_skills else "None identified"
    weak = ", ".join(weak_subjects) if weak_subjects else "None"
    hours_label = f"{daily_hours} hour{'s' if daily_hours != 1 else ''}/day"

    return f"""You are a senior career readiness coach for KIET Group of Institutions students.

A student has the following profile:
- Target Role: {target_role}
- Overall Readiness Score: {overall_score}/100 ({readiness_tier})
- Daily Study Hours: {hours_label}
- Current Focus Area: {focus_area}
- Missing Core Skills: {missing}
- Weak Academic Subjects: {weak}
- Projects Built: {proj_titles}

Generate a JSON response (no markdown, no code fences, pure JSON) with EXACTLY this structure:
{{
  "readiness_explanation": "2-3 sentence honest, motivating diagnosis of their current readiness level and biggest gaps",
  "action_plan": [
    {{
      "milestone": 1,
      "title": "Milestone 1 title (2 weeks)",
      "tasks": [
        {{"title": "task title", "description": "specific actionable detail", "priority": "High", "target_days": 7}},
        {{"title": "task title", "description": "specific actionable detail", "priority": "High", "target_days": 10}},
        {{"title": "task title", "description": "specific actionable detail", "priority": "Medium", "target_days": 14}}
      ]
    }},
    {{
      "milestone": 2,
      "title": "Milestone 2 title (Month 1)",
      "tasks": [
        {{"title": "task title", "description": "specific actionable detail", "priority": "High", "target_days": 20}},
        {{"title": "task title", "description": "specific actionable detail", "priority": "Medium", "target_days": 25}},
        {{"title": "task title", "description": "specific actionable detail", "priority": "Medium", "target_days": 30}}
      ]
    }},
    {{
      "milestone": 3,
      "title": "Milestone 3 title (Month 2)",
      "tasks": [
        {{"title": "task title", "description": "specific actionable detail", "priority": "High", "target_days": 40}},
        {{"title": "task title", "description": "specific actionable detail", "priority": "Medium", "target_days": 50}},
        {{"title": "task title", "description": "specific actionable detail", "priority": "Low", "target_days": 60}}
      ]
    }},
    {{
      "milestone": 4,
      "title": "Milestone 4 title (Month 3 — Interview Ready)",
      "tasks": [
        {{"title": "task title", "description": "specific actionable detail", "priority": "High", "target_days": 70}},
        {{"title": "task title", "description": "specific actionable detail", "priority": "High", "target_days": 80}},
        {{"title": "task title", "description": "specific actionable detail", "priority": "Medium", "target_days": 90}}
      ]
    }}
  ],
  "interview_questions": [
    "Project-specific or role-specific interview question 1?",
    "Interview question 2?",
    "Interview question 3?",
    "Interview question 4?",
    "Interview question 5?",
    "Interview question 6?"
  ]
}}

Tailor EVERY task to: {target_role}, {hours_label} available, focus on {focus_area}.
Address missing skills: {missing}. Keep tasks highly specific and actionable."""


# ---------------------------------------------------------------------------
# google-genai Interactions API client  (gemini-4-hydrogen)
# ---------------------------------------------------------------------------

def _call_gemini_interactions(prompt: str, result_container: list) -> None:
    """
    Runs in a daemon thread so we can enforce a hard timeout.
    Uses the current google-genai >= 3.2.0 Interactions API.
    """
    if not config.GEMINI_API_KEY:
        return
    try:
        from google import genai  # google-genai >= 3.2.0

        client = genai.Client(api_key=config.GEMINI_API_KEY)
        interaction = client.interactions.create(
            model=GEMINI_MODEL,
            input=prompt,
        )
        raw = interaction.output_text or ""
        # Strip markdown fences if the model added them
        if raw.strip().startswith("```"):
            parts = raw.strip().split("```")
            raw = parts[1] if len(parts) > 1 else raw
            if raw.startswith("json"):
                raw = raw[4:]
        parsed = json.loads(raw.strip())
        result_container.append(parsed)
    except Exception as exc:
        logger.warning(f"[Gemini Interactions API] Failed: {exc}")


def _call_gemini(prompt: str) -> dict | None:
    """Thread-based call with hard AI_TIMEOUT wall-clock limit."""
    container: list = []
    t = threading.Thread(target=_call_gemini_interactions, args=(prompt, container), daemon=True)
    t.start()
    t.join(timeout=config.AI_TIMEOUT)
    return container[0] if container else None


# ---------------------------------------------------------------------------
# AGY SDK multi-agent orchestration (optional enrichment layer)
# ---------------------------------------------------------------------------

def _call_agy_agent(prompt: str, result_container: list) -> None:
    """
    Uses the google-antigravity SDK LocalAgentConfig with gemini-4-hydrogen.
    Spawns a career-coaching agent that returns structured JSON.
    """
    if not config.GEMINI_API_KEY:
        return
    try:
        from antigravity import Agent, LocalAgentConfig  # google-antigravity SDK

        agent = Agent(
            config=LocalAgentConfig(
                api_key=config.GEMINI_API_KEY,
                model=GEMINI_MODEL,
            ),
            system_instruction=(
                "You are a senior KIET career readiness coach. "
                "Always respond with pure JSON only — no markdown, no prose outside JSON."
            ),
        )
        conversation = agent.start_conversation()
        response = conversation.send(prompt)
        raw = response.text or ""
        if raw.strip().startswith("```"):
            parts = raw.strip().split("```")
            raw = parts[1] if len(parts) > 1 else raw
            if raw.startswith("json"):
                raw = raw[4:]
        parsed = json.loads(raw.strip())
        result_container.append(parsed)
    except Exception as exc:
        logger.warning(f"[AGY SDK agent] Failed: {exc}")


def _call_agy(prompt: str) -> dict | None:
    """Thread-based AGY agent call with hard timeout."""
    container: list = []
    t = threading.Thread(target=_call_agy_agent, args=(prompt, container), daemon=True)
    t.start()
    t.join(timeout=config.AI_TIMEOUT)
    return container[0] if container else None


# ---------------------------------------------------------------------------
# Groq fallback
# ---------------------------------------------------------------------------

def _call_groq_api(prompt: str, result_container: list) -> None:
    if not config.GROQ_API_KEY:
        return
    try:
        from groq import Groq
        client = Groq(api_key=config.GROQ_API_KEY)
        chat = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama3-8b-8192",
            temperature=0.7,
            max_tokens=2048,
        )
        raw = chat.choices[0].message.content.strip()
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else raw
            if raw.startswith("json"):
                raw = raw[4:]
        result_container.append(json.loads(raw.strip()))
    except Exception as exc:
        logger.warning(f"[Groq] Failed: {exc}")


def _call_groq(prompt: str) -> dict | None:
    container: list = []
    t = threading.Thread(target=_call_groq_api, args=(prompt, container), daemon=True)
    t.start()
    t.join(timeout=config.AI_TIMEOUT)
    return container[0] if container else None


# ---------------------------------------------------------------------------
# Deterministic rule-based fallback (100% offline, zero external deps)
# ---------------------------------------------------------------------------

FALLBACK_TEMPLATES: dict[str, dict] = {
    "Full-Stack Developer": {
        "milestones": [
            ("Foundation Sprint", [
                ("Master HTML/CSS Flexbox & Grid layout", "Build 3 responsive page layouts using CSS Grid + Flexbox. Use MDN docs.", "High", 7),
                ("JavaScript ES6+ deep dive", "Cover arrow functions, destructuring, async/await, and module imports.", "High", 10),
                ("Git & GitHub workflow", "Create a GitHub profile, push daily code, master branching & PR workflow.", "Medium", 14),
            ]),
            ("Backend Basics", [
                ("Build a Flask REST API with CRUD operations", "Design /users, /items endpoints with GET/POST/PUT/DELETE. Test with Postman.", "High", 20),
                ("Implement JWT authentication", "Add /register & /login endpoints with PyJWT. Store hashed passwords with Werkzeug.", "High", 25),
                ("SQLite database integration", "Connect Flask to SQLite using parameterized queries. Design a 3-table schema.", "Medium", 30),
            ]),
            ("Frontend Framework", [
                ("React components & hooks mastery", "Build 5 reusable components with useState, useEffect, and props.", "High", 40),
                ("React + Flask full-stack app", "Connect your React frontend to your Flask API with JWT auth flow.", "High", 50),
                ("Deploy on Railway / Render", "Push your full-stack app live. Configure environment variables securely.", "Low", 60),
            ]),
            ("Interview Readiness", [
                ("LeetCode 30-problem sprint", "Solve 30 Easy/Medium problems in Python covering arrays, strings, hashmap.", "High", 70),
                ("System design fundamentals", "Study REST vs GraphQL, database indexing, caching basics (Redis).", "High", 80),
                ("Portfolio polish & mock interviews", "Record a 2-min walkthrough of your best project. Do 3 mock interviews.", "Medium", 90),
            ]),
        ],
        "interview_questions": [
            "Walk me through the architecture of your most complex full-stack project.",
            "How does the HTTP request-response cycle work in a REST API?",
            "Explain the difference between SQL and NoSQL — when would you choose each?",
            "What is CORS and how did you handle it in your Flask application?",
            "Describe how JWT authentication works from login to protected route access.",
            "What is the virtual DOM and why does React use it over direct DOM manipulation?",
        ],
    },
    "AI/ML Engineer": {
        "milestones": [
            ("Math & Python Foundation", [
                ("Revise Linear Algebra essentials", "Cover matrix multiplication, eigenvalues, PCA. Use 3Blue1Brown + numpy practice.", "High", 7),
                ("NumPy + Pandas 30-challenge", "Complete 30 data manipulation exercises covering groupby, merge, reshape.", "High", 10),
                ("Implement gradient descent from scratch", "Code batch GD, mini-batch GD, and SGD in pure Python. Plot loss curves.", "Medium", 14),
            ]),
            ("Core ML Models", [
                ("Train & compare 5 sklearn models", "Use LogReg, SVM, Random Forest, XGBoost, KNN on a Kaggle dataset. Compare AUC.", "High", 20),
                ("Master cross-validation & tuning", "Implement GridSearchCV & RandomizedSearchCV. Understand overfitting vs underfitting.", "High", 25),
                ("Build & submit a Kaggle competition", "Complete data EDA → feature engineering → model → submission pipeline.", "Medium", 30),
            ]),
            ("Deep Learning & NLP", [
                ("Implement CNN for CIFAR-10", "Build a CNN with TensorFlow/Keras achieving >80% accuracy.", "High", 40),
                ("Fine-tune a Hugging Face BERT model", "Fine-tune bert-base-uncased for sentiment classification on a custom dataset.", "High", 50),
                ("Build an end-to-end NLP pipeline", "Create a text classification API with FastAPI + transformers + Docker.", "Low", 60),
            ]),
            ("MLOps & Interview Ready", [
                ("Deploy model as REST API", "Wrap your best model in Flask/FastAPI, Dockerize it, deploy to Render.", "High", 70),
                ("Build a Streamlit ML demo", "Create an interactive app where users input data and see predictions in real time.", "High", 80),
                ("Prepare 25 ML interview Q&As", "Cover bias-variance, regularization, evaluation metrics, and system design.", "Medium", 90),
            ]),
        ],
        "interview_questions": [
            "Explain the bias-variance tradeoff with an example from your projects.",
            "How did you handle class imbalance in your dataset? What metrics did you use?",
            "What is the difference between precision and recall? When do you optimise for each?",
            "Walk me through how backpropagation works mathematically.",
            "How would you deploy an ML model to production and monitor it over time?",
            "Explain regularization (L1 vs L2) and when you'd use each.",
        ],
    },
    "Backend Python Developer": {
        "milestones": [
            ("Python Mastery", [
                ("Master Python OOP patterns", "Implement inheritance, composition, metaclasses, and dataclasses with real examples.", "High", 7),
                ("Asyncio & concurrency", "Build an async web scraper using aiohttp. Understand event loops vs threads.", "High", 10),
                ("Write 10 Python utility scripts", "Cover file I/O, regex, CSV parsing, API client, CLI tool using argparse.", "Medium", 14),
            ]),
            ("API Development", [
                ("Build a full FastAPI + PostgreSQL API", "Design /users, /products endpoints with Pydantic validation and SQLAlchemy ORM.", "High", 20),
                ("Implement JWT with refresh tokens", "Add access tokens (15min) + refresh tokens (7d). Implement token rotation.", "High", 25),
                ("Achieve 80% test coverage with pytest", "Write unit + integration tests. Use pytest-cov and fixtures for DB isolation.", "Medium", 30),
            ]),
            ("System Design & DB", [
                ("Design a scalable database schema", "Model a multi-tenant SaaS schema. Add indexes, foreign keys, audit columns.", "High", 40),
                ("Redis caching fundamentals", "Cache top 100 API responses in Redis. Implement cache invalidation strategy.", "Medium", 50),
                ("Celery background tasks", "Implement email sending + report generation as async Celery workers.", "Low", 60),
            ]),
            ("Interview Ready", [
                ("Containerise app with Docker Compose", "Write Dockerfile + docker-compose.yml for API + PostgreSQL + Redis stack.", "High", 70),
                ("Solve 25 DSA problems in Python", "Focus on two pointers, sliding window, BFS/DFS, and dynamic programming.", "High", 80),
                ("System design: URL shortener design", "Design bit.ly: LB, DB sharding, caching layer, rate limiting, analytics.", "Medium", 90),
            ]),
        ],
        "interview_questions": [
            "Explain Python's GIL and how it affects multithreading vs multiprocessing.",
            "What is the difference between Flask and FastAPI? Why choose one over the other?",
            "How do you prevent SQL injection in Python APIs? Show a code example.",
            "Describe your database indexing strategy for a high-traffic backend API.",
            "Walk me through your testing strategy — unit, integration, and end-to-end.",
            "What happens internally when a client sends a POST /login request to your API?",
        ],
    },
    "Data Analyst": {
        "milestones": [
            ("SQL & Excel Mastery", [
                ("SQL 50 on HackerRank", "Complete all 50 HackerRank SQL problems covering joins, aggregation, subqueries.", "High", 7),
                ("Excel advanced functions", "Master VLOOKUP, INDEX-MATCH, pivot tables, conditional formatting, data validation.", "High", 10),
                ("SQL window functions", "Practice ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD with real business scenarios.", "Medium", 14),
            ]),
            ("Python for Analysis", [
                ("Pandas 30-day challenge", "30 daily exercises covering read_csv, groupby, merge, pivot, fillna, agg.", "High", 20),
                ("Visualise 5 datasets", "Create publication-quality plots with matplotlib & seaborn covering 5 chart types.", "High", 25),
                ("Automated data-cleaning pipeline", "Build a pipeline that detects nulls, outliers, duplicates, and type errors.", "Medium", 30),
            ]),
            ("Dashboard & BI Tools", [
                ("Interactive Plotly dashboard", "Build a multi-filter dashboard with dropdowns, date pickers, and KPI cards.", "High", 40),
                ("Power BI report from scratch", "Connect to CSV, build a star schema, create 5 visuals and publish to web.", "Medium", 50),
                ("KPI tracking metrics system", "Define and calculate 10 business KPIs with DAX or Python formulas.", "Low", 60),
            ]),
            ("Storytelling & Interview", [
                ("3 end-to-end case studies", "Document your process: business question → data → analysis → insight → recommendation.", "High", 70),
                ("Statistical testing fundamentals", "Learn t-test, chi-square, A/B test design, p-value, and confidence intervals.", "High", 80),
                ("Stakeholder presentation practice", "Create a 5-minute data story presentation. Practice with non-technical audience.", "Medium", 90),
            ]),
        ],
        "interview_questions": [
            "How would you investigate a sudden 30% drop in daily active users?",
            "Explain the difference between INNER JOIN, LEFT JOIN, and FULL OUTER JOIN with examples.",
            "Walk me through how you cleaned and prepared data for your COVID-19 dashboard.",
            "What is a p-value and how would you explain it to a non-technical stakeholder?",
            "How do you detect and handle outliers in a dataset? What approaches did you use?",
            "Describe a time your analysis directly influenced a business or academic decision.",
        ],
    },
}


def _make_fallback(
    target_role: str,
    daily_hours: float,
    missing_skills: list[str],
    weak_subjects: list[str],
    overall_score: float,
    readiness_tier: str,
) -> dict[str, Any]:
    template = FALLBACK_TEMPLATES.get(target_role, FALLBACK_TEMPLATES["Full-Stack Developer"])

    # Build personalised diagnosis
    if readiness_tier == "Industry Ready":
        diagnosis = (
            f"Outstanding! Your readiness score of {overall_score:.1f}/100 places you at an industry-competitive level for {target_role} roles. "
            f"Focus on polishing your GitHub portfolio, practising system design, and refining your interview storytelling to convert opportunities into offers."
        )
    elif readiness_tier == "Developing":
        gaps = ", ".join(missing_skills[:3]) if missing_skills else "some advanced areas"
        diagnosis = (
            f"You're on a solid trajectory with a score of {overall_score:.1f}/100 — well past the foundations. "
            f"Your main skill gaps are: {gaps}. With {daily_hours}h/day of focused practice, "
            f"you can reach industry-ready status in 2–3 months by following this roadmap."
        )
    else:
        gap_note = f"particularly {', '.join(missing_skills[:2])}" if missing_skills else "core fundamentals"
        diagnosis = (
            f"Your score of {overall_score:.1f}/100 reflects early-stage {target_role} skills — this is completely normal. "
            f"You need to build up {gap_note}. With {daily_hours}h/day dedicated to this 90-day plan, "
            f"you'll transform your profile into one that attracts real opportunities."
        )

    # Build milestones from template
    milestones_data = []
    for m_idx, (m_title, tasks) in enumerate(template["milestones"]):
        task_list = []
        for t_title, t_desc, t_priority, t_days in tasks:
            task_list.append({
                "title": t_title,
                "description": t_desc,
                "priority": t_priority,
                "target_days": t_days,
            })
        milestones_data.append({
            "milestone": m_idx + 1,
            "title": f"Milestone {m_idx + 1}: {m_title}",
            "tasks": task_list,
        })

    return {
        "readiness_explanation": diagnosis,
        "action_plan": milestones_data,
        "interview_questions": template["interview_questions"],
        "source": "offline_fallback",
    }


# ---------------------------------------------------------------------------
# Response validator
# ---------------------------------------------------------------------------

def _validate(data: dict) -> bool:
    return (
        isinstance(data, dict)
        and "readiness_explanation" in data
        and "action_plan" in data
        and "interview_questions" in data
        and isinstance(data["action_plan"], list)
        and len(data["action_plan"]) >= 1
    )


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_ai_plan(
    target_role: str,
    daily_hours: float,
    focus_area: str,
    missing_skills: list[str],
    weak_subjects: list[str],
    projects: list[dict],
    overall_score: float,
    readiness_tier: str,
) -> dict[str, Any]:
    """
    Priority: Gemini Interactions API (gemini-4-hydrogen)
              → AGY SDK agent
              → Groq (llama3-8b-8192)
              → Deterministic Python fallback

    Hard timeout: AI_TIMEOUT seconds per provider.
    Always returns a valid, structured response.
    """
    prompt = _build_prompt(
        target_role, daily_hours, focus_area,
        missing_skills, weak_subjects, projects,
        overall_score, readiness_tier,
    )

    # 1. Gemini 4 Hydrogen via Interactions API
    result = _call_gemini(prompt)
    if result and _validate(result):
        result["source"] = "gemini-4-hydrogen"
        logger.info("AI plan generated via Gemini 4 Hydrogen (Interactions API)")
        return result

    # 2. AGY SDK multi-agent
    result = _call_agy(prompt)
    if result and _validate(result):
        result["source"] = "agy-agent"
        logger.info("AI plan generated via AGY SDK agent")
        return result

    # 3. Groq
    result = _call_groq(prompt)
    if result and _validate(result):
        result["source"] = "groq"
        logger.info("AI plan generated via Groq")
        return result

    # 4. Deterministic offline fallback
    logger.info("Using deterministic offline fallback for AI plan generation.")
    return _make_fallback(
        target_role, daily_hours, missing_skills,
        weak_subjects, overall_score, readiness_tier,
    )
