# ─────────────────────────────────────────────────────────────────────────────
# backend/services/readiness_engine.py
# Pure Python skill-gap analysis & readiness scoring engine
# No external dependencies — works 100% offline
# ─────────────────────────────────────────────────────────────────────────────
from __future__ import annotations
from typing import Any

# ─── Benchmark skill matrices per target role ────────────────────────────────

ROLE_SKILL_MATRIX: dict[str, dict[str, Any]] = {
    "Full-Stack Developer": {
        "core": ["python", "javascript", "html", "css", "react", "nodejs", "express",
                 "rest api", "git", "sql", "mongodb", "authentication"],
        "advanced": ["typescript", "redux", "docker", "ci/cd", "graphql", "redis",
                     "websockets", "cloud deployment"],
        "weight_core": 0.70,
    },
    "AI/ML Engineer": {
        "core": ["python", "numpy", "pandas", "scikit-learn", "machine learning",
                 "deep learning", "tensorflow", "pytorch", "nlp", "data preprocessing",
                 "model evaluation", "statistics"],
        "advanced": ["transformers", "bert", "llm", "mlops", "feature engineering",
                     "computer vision", "reinforcement learning", "hugging face"],
        "weight_core": 0.70,
    },
    "Backend Python Developer": {
        "core": ["python", "flask", "fastapi", "django", "rest api", "sql",
                 "postgresql", "jwt", "authentication", "git", "linux", "unit testing"],
        "advanced": ["docker", "kubernetes", "redis", "celery", "microservices",
                     "grpc", "rabbitmq", "cloud (aws/gcp/azure)"],
        "weight_core": 0.70,
    },
    "Data Analyst": {
        "core": ["python", "sql", "pandas", "excel", "data visualization",
                 "statistics", "pivot tables", "power bi", "tableau", "matplotlib",
                 "jupyter"],
        "advanced": ["plotly", "seaborn", "etl", "data cleaning", "regression analysis",
                     "a/b testing", "dashboard design", "business intelligence"],
        "weight_core": 0.70,
    },
}

COMPLEXITY_WEIGHT = {"Beginner": 0.5, "Intermediate": 1.0, "Advanced": 1.5}

READINESS_TIERS = [
    (80, "Industry Ready"),
    (60, "Developing"),
    (0, "Needs Foundation"),
]


# ─── Main scoring function ───────────────────────────────────────────────────

def compute_readiness(
    assessments: list[dict],
    projects: list[dict],
    certifications: list[dict],
    target_role: str,
    daily_hours: float = 2.0,
) -> dict[str, Any]:
    """
    Returns a fully typed readiness report:
    {
        overall_score, readiness_tier,
        academic_index, skill_index, evidence_index,
        matched_skills, missing_skills, weak_subjects,
        project_count, cert_count,
        skill_match_pct
    }
    """
    target_role = target_role if target_role in ROLE_SKILL_MATRIX else "Full-Stack Developer"
    matrix = ROLE_SKILL_MATRIX[target_role]

    # ── 1. Academic & Assessment Index (35%) ──────────────────────────────
    academic_index = _compute_academic(assessments)

    # ── 2. Skill Alignment Index (40%) ───────────────────────────────────
    skill_index, matched_skills, missing_skills, skill_match_pct = _compute_skill_alignment(
        projects, certifications, assessments, matrix
    )

    # ── 3. Project & Practical Evidence Index (25%) ───────────────────────
    evidence_index, project_count, cert_count = _compute_evidence(projects, certifications, daily_hours)

    # ── Overall weighted score ────────────────────────────────────────────
    overall = round(
        (academic_index * 0.35) + (skill_index * 0.40) + (evidence_index * 0.25),
        1,
    )
    overall = max(0.0, min(100.0, overall))

    tier = next(label for threshold, label in READINESS_TIERS if overall >= threshold)

    # ── Weak subjects (academic score < 70) ──────────────────────────────
    weak_subjects = [
        a["subject"] for a in assessments if (a["score"] / max(a["max_score"], 1)) * 100 < 70
    ]

    return {
        "overall_score": overall,
        "readiness_tier": tier,
        "academic_index": round(academic_index, 1),
        "skill_index": round(skill_index, 1),
        "evidence_index": round(evidence_index, 1),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "weak_subjects": weak_subjects,
        "project_count": project_count,
        "cert_count": cert_count,
        "skill_match_pct": skill_match_pct,
        "target_role": target_role,
    }


# ─── Sub-scorers ─────────────────────────────────────────────────────────────

def _compute_academic(assessments: list[dict]) -> float:
    """Weighted average normalised to 100."""
    if not assessments:
        return 40.0  # reasonable floor for no data

    # Weight: exam=1.0, quiz=0.6, assignment=0.4
    TYPE_WEIGHT = {"exam": 1.0, "quiz": 0.6, "assignment": 0.4}
    total_w = total_s = 0.0
    for a in assessments:
        pct = (a["score"] / max(a["max_score"], 1)) * 100
        w = TYPE_WEIGHT.get(a.get("type", "exam"), 0.7)
        total_s += pct * w
        total_w += w * 100  # max possible weighted score

    return (total_s / total_w) * 100 if total_w else 40.0


def _compute_skill_alignment(
    projects: list[dict],
    certifications: list[dict],
    assessments: list[dict],
    matrix: dict,
) -> tuple[float, list[str], list[str], int]:
    """Keyword match against role matrix. Returns (index, matched, missing, pct)."""
    # Build a bag-of-words from all evidence
    evidence_text = " ".join([
        (p.get("tech_stack") or "") + " " + (p.get("description") or "")
        for p in projects
    ] + [
        (c.get("title") or "") + " " + (c.get("issuer") or "")
        for c in certifications
    ] + [
        (a.get("subject") or "") for a in assessments
    ]).lower()

    core_skills = matrix["core"]
    adv_skills = matrix["advanced"]

    matched_core = [s for s in core_skills if s in evidence_text]
    matched_adv = [s for s in adv_skills if s in evidence_text]
    missing_core = [s for s in core_skills if s not in evidence_text]

    core_ratio = len(matched_core) / max(len(core_skills), 1)
    adv_bonus = min(len(matched_adv) * 3, 20)  # up to +20 bonus

    index = min(100.0, core_ratio * 90 + adv_bonus)
    pct = round(core_ratio * 100)
    matched = matched_core + matched_adv
    return index, matched, missing_core, pct


def _compute_evidence(
    projects: list[dict], certifications: list[dict], daily_hours: float
) -> tuple[float, int, int]:
    """Score based on project complexity and cert diversity."""
    p_score = sum(COMPLEXITY_WEIGHT.get(p.get("complexity", "Beginner"), 0.5) for p in projects)
    p_score = min(p_score, 6.0)  # cap at 6 units

    cert_bonus = min(len(certifications) * 1.5, 6.0)  # each cert adds 1.5, max 6

    # Daily hours engagement bonus (diminishing returns after 4 hrs)
    hours_bonus = min(daily_hours * 2, 8.0)

    raw = p_score * 8 + cert_bonus * 5 + hours_bonus
    index = min(100.0, raw)
    return index, len(projects), len(certifications)


# ─── Radar chart data helper ──────────────────────────────────────────────────

def build_radar_data(report: dict, assessments: list[dict]) -> dict:
    """
    Returns 5-axis radar data for Chart.js:
    Academic, Skill Alignment, Project Evidence, Consistency, Certification
    """
    consistency = min(100, report.get("project_count", 0) * 15 + report.get("cert_count", 0) * 10 + 30)
    cert_score = min(100, report.get("cert_count", 0) * 25)

    return {
        "labels": ["Academic", "Skill Alignment", "Projects", "Consistency", "Certifications"],
        "scores": [
            report["academic_index"],
            report["skill_index"],
            report["evidence_index"],
            consistency,
            cert_score,
        ],
    }
