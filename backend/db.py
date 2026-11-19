# ─────────────────────────────────────────────────────────────────────────────
# backend/db.py
# SQLite schema initialisation + realistic KIET cohort seed data
# ─────────────────────────────────────────────────────────────────────────────
import sqlite3
import hashlib
import os
import json
from datetime import datetime, timedelta, date
from backend.config import config

# ---------------------------------------------------------------------------
# Connection helper
# ---------------------------------------------------------------------------

def get_db():
    """Return a row-factory SQLite connection."""
    conn = sqlite3.connect(config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def _hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

SCHEMA = """
-- Users table (students + faculty)
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    email           TEXT    UNIQUE NOT NULL,
    enrollment_no   TEXT    UNIQUE,
    password_hash   TEXT    NOT NULL,
    role            TEXT    NOT NULL DEFAULT 'student',  -- 'student' | 'faculty'
    target_role     TEXT    DEFAULT 'Full-Stack Developer',
    daily_hours     REAL    DEFAULT 2.0,
    focus_area      TEXT    DEFAULT 'Projects',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    last_active     TEXT    DEFAULT (datetime('now'))
);

-- Academic assessments (tests, quizzes, mid-terms)
CREATE TABLE IF NOT EXISTS assessments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject     TEXT    NOT NULL,
    score       REAL    NOT NULL,
    max_score   REAL    NOT NULL DEFAULT 100,
    type        TEXT    DEFAULT 'exam',   -- 'exam'|'quiz'|'assignment'
    recorded_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Projects / evidence
CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    description TEXT,
    tech_stack  TEXT,           -- comma-separated tags
    complexity  TEXT    DEFAULT 'Beginner',  -- 'Beginner'|'Intermediate'|'Advanced'
    github_url  TEXT,
    added_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Certifications & hackathons
CREATE TABLE IF NOT EXISTS certifications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    issuer      TEXT,
    type        TEXT    DEFAULT 'certification',  -- 'certification'|'hackathon'|'course'
    issued_date TEXT,
    added_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- AI-generated action plans (milestones)
CREATE TABLE IF NOT EXISTS action_plans (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_score   REAL,
    readiness_tier  TEXT,
    diagnosis       TEXT,
    milestones      TEXT,   -- JSON array of milestone objects
    interview_qs    TEXT,   -- JSON array of question strings
    generated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    is_active       INTEGER NOT NULL DEFAULT 1
);

-- Editable plan tasks (child of action_plans)
CREATE TABLE IF NOT EXISTS plan_tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id     INTEGER NOT NULL REFERENCES action_plans(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    milestone   INTEGER NOT NULL DEFAULT 1,  -- 1-4
    title       TEXT    NOT NULL,
    description TEXT,
    priority    TEXT    DEFAULT 'Medium',    -- 'High'|'Medium'|'Low'
    target_date TEXT,
    completed   INTEGER NOT NULL DEFAULT 0,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Daily progress / streaks
CREATE TABLE IF NOT EXISTS progress_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date    TEXT    NOT NULL,  -- YYYY-MM-DD
    tasks_done  INTEGER NOT NULL DEFAULT 0,
    score_snap  REAL,
    UNIQUE(user_id, log_date)
);
"""

# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

SEED_STUDENTS = [
    {
        "name": "Amarjeet Kumar",
        "email": "amarjeet.2628MCA0069@kiet.edu",
        "enrollment_no": "2628MCA0069",
        "password": "Student@123",
        "target_role": "AI/ML Engineer",
        "daily_hours": 4.0,
        "focus_area": "Projects",
        "assessments": [
            ("Python Programming", 88, 100, "exam"),
            ("Data Structures", 82, 100, "exam"),
            ("Machine Learning Basics", 91, 100, "quiz"),
            ("Mathematics for AI", 79, 100, "assignment"),
        ],
        "projects": [
            ("Sentiment Analysis Dashboard", "Real-time Twitter sentiment using BERT + Flask REST API", "Python,Flask,BERT,NLP,SQLite", "Advanced"),
            ("Student Grade Predictor", "ML model predicting student grades from study hours & attendance", "Python,scikit-learn,pandas,matplotlib", "Intermediate"),
        ],
        "certs": [
            ("Google AI Essentials", "Google", "certification", "2024-08-10"),
            ("Kaggle ML Course", "Kaggle", "course", "2024-06-20"),
            ("HackFest 2024 Runner-Up", "NIT Allahabad", "hackathon", "2024-09-15"),
        ],
    },
    {
        "name": "Akhilesh Chaubey",
        "email": "akhilesh.2628MCA0206@kiet.edu",
        "enrollment_no": "2628MCA0206",
        "password": "Student@123",
        "target_role": "Full-Stack Developer",
        "daily_hours": 3.0,
        "focus_area": "Projects",
        "assessments": [
            ("Web Development", 85, 100, "exam"),
            ("Database Management", 78, 100, "exam"),
            ("JavaScript Fundamentals", 90, 100, "quiz"),
            ("React Basics", 72, 100, "assignment"),
        ],
        "projects": [
            ("KIET Event Portal", "Full-stack event management system with React frontend", "React,Node.js,MongoDB,Express,CSS", "Intermediate"),
            ("Expense Tracker App", "Personal finance tracker with charts and SQLite backend", "Python,Flask,SQLite,Chart.js,HTML", "Beginner"),
        ],
        "certs": [
            ("Meta Front-End Developer", "Meta/Coursera", "certification", "2024-07-15"),
            ("AWS Cloud Practitioner", "Amazon", "certification", "2024-10-01"),
        ],
    },
    {
        "name": "Arpit Tiwari",
        "email": "arpit.2628MCA0240@kiet.edu",
        "enrollment_no": "2628MCA0240",
        "password": "Student@123",
        "target_role": "Backend Python Developer",
        "daily_hours": 2.0,
        "focus_area": "DSA/Coding",
        "assessments": [
            ("Python Programming", 76, 100, "exam"),
            ("Algorithms", 68, 100, "exam"),
            ("System Design Basics", 71, 100, "quiz"),
        ],
        "projects": [
            ("REST API for Library Management", "FastAPI-based CRUD API with JWT auth and PostgreSQL", "Python,FastAPI,PostgreSQL,JWT,Docker", "Intermediate"),
        ],
        "certs": [
            ("Python for Everybody", "University of Michigan/Coursera", "course", "2024-05-10"),
        ],
    },
    {
        "name": "Ankit Pathak",
        "email": "ankit.2628MCA0256@kiet.edu",
        "enrollment_no": "2628MCA0256",
        "password": "Student@123",
        "target_role": "Data Analyst",
        "daily_hours": 2.0,
        "focus_area": "Core CS",
        "assessments": [
            ("Statistics & Probability", 83, 100, "exam"),
            ("Python Programming", 74, 100, "exam"),
            ("Data Visualization", 88, 100, "quiz"),
            ("SQL Fundamentals", 80, 100, "assignment"),
        ],
        "projects": [
            ("COVID-19 Data Dashboard", "Interactive Plotly dashboard analysing India district-level data", "Python,Plotly,pandas,Jupyter,CSV", "Intermediate"),
            ("Sales Analytics Pipeline", "ETL pipeline + Power BI dashboard for retail sales data", "Python,pandas,SQL,Power BI,Excel", "Beginner"),
        ],
        "certs": [
            ("Google Data Analytics Certificate", "Google/Coursera", "certification", "2024-09-20"),
            ("Tableau Desktop Specialist", "Salesforce Tableau", "certification", "2024-11-05"),
        ],
    },
    {
        "name": "Archana Tiwari",
        "email": "archana.2628MCA0030@kiet.edu",
        "enrollment_no": "2628MCA0030",
        "password": "Student@123",
        "target_role": "AI/ML Engineer",
        "daily_hours": 1.0,
        "focus_area": "Interview Prep",
        "assessments": [
            ("Python Programming", 65, 100, "exam"),
            ("Mathematics for AI", 60, 100, "exam"),
            ("Machine Learning Basics", 55, 100, "quiz"),
        ],
        "projects": [
            ("Handwriting Digit Classifier", "CNN-based MNIST classifier with Streamlit demo", "Python,TensorFlow,Streamlit,numpy", "Beginner"),
        ],
        "certs": [
            ("AI For Everyone", "DeepLearning.AI", "course", "2024-08-25"),
        ],
    },
]


def _seed_progress(conn, user_id: int, base_score: float):
    """Insert 30 days of realistic progress logs for a user."""
    today = date.today()
    for i in range(29, -1, -1):
        d = today - timedelta(days=i)
        # Skip ~20% days to simulate real streak breaks
        if i % 7 == 3:
            continue
        tasks_done = max(1, int(2 + (base_score / 30) - (i * 0.03)))
        score_snap = round(base_score - i * 0.3, 1)
        try:
            conn.execute(
                "INSERT OR IGNORE INTO progress_logs (user_id, log_date, tasks_done, score_snap) VALUES (?, ?, ?, ?)",
                (user_id, d.isoformat(), tasks_done, score_snap),
            )
        except Exception:
            pass


def init_db():
    """Create schema and seed data (idempotent)."""
    conn = get_db()
    conn.executescript(SCHEMA)

    # Seed faculty account
    existing_faculty = conn.execute(
        "SELECT id FROM users WHERE email = ?", (config.ADMIN_EMAIL,)
    ).fetchone()
    if not existing_faculty:
        conn.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ("Dr. Faculty KIET", config.ADMIN_EMAIL, _hash(config.ADMIN_PASSWORD), "faculty"),
        )

    # Seed students
    base_scores = [82, 76, 68, 79, 58]
    for idx, s in enumerate(SEED_STUDENTS):
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ?", (s["email"],)
        ).fetchone()
        if existing:
            continue

        conn.execute(
            """INSERT INTO users
               (name, email, enrollment_no, password_hash, role, target_role, daily_hours, focus_area)
               VALUES (?, ?, ?, ?, 'student', ?, ?, ?)""",
            (s["name"], s["email"], s["enrollment_no"], _hash(s["password"]),
             s["target_role"], s["daily_hours"], s["focus_area"]),
        )
        uid = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

        for subj, score, mx, typ in s["assessments"]:
            conn.execute(
                "INSERT INTO assessments (user_id, subject, score, max_score, type) VALUES (?, ?, ?, ?, ?)",
                (uid, subj, score, mx, typ),
            )
        for title, desc, tech, comp in s["projects"]:
            conn.execute(
                "INSERT INTO projects (user_id, title, description, tech_stack, complexity) VALUES (?, ?, ?, ?, ?)",
                (uid, title, desc, tech, comp),
            )
        for title, issuer, typ, idate in s["certs"]:
            conn.execute(
                "INSERT INTO certifications (user_id, title, issuer, type, issued_date) VALUES (?, ?, ?, ?, ?)",
                (uid, title, issuer, typ, idate),
            )
        _seed_progress(conn, uid, base_scores[idx])

    conn.commit()
    conn.close()
