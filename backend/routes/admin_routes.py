# ─────────────────────────────────────────────────────────────────────────────
# backend/routes/admin_routes.py
# Faculty / Coordinator cohort analytics, KPIs, skill-gap charts, CSV export
# ─────────────────────────────────────────────────────────────────────────────
import csv
import io
from flask import Blueprint, jsonify, make_response, g
from backend.auth import admin_required
from backend.db import get_db
from backend.services.readiness_engine import compute_readiness, ROLE_SKILL_MATRIX

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _load_student_report(uid: int, db) -> dict:
    """Compute readiness for one student — returns a summary dict."""
    user = db.execute(
        "SELECT id, name, email, enrollment_no, target_role, daily_hours, focus_area FROM users WHERE id = ?",
        (uid,),
    ).fetchone()
    assessments = [dict(r) for r in db.execute("SELECT * FROM assessments WHERE user_id = ?", (uid,)).fetchall()]
    projects = [dict(r) for r in db.execute("SELECT * FROM projects WHERE user_id = ?", (uid,)).fetchall()]
    certs = [dict(r) for r in db.execute("SELECT * FROM certifications WHERE user_id = ?", (uid,)).fetchall()]

    report = compute_readiness(
        assessments=assessments,
        projects=projects,
        certifications=certs,
        target_role=user["target_role"] or "Full-Stack Developer",
        daily_hours=user["daily_hours"] or 2.0,
    )
    return {
        "user_id": uid,
        "name": user["name"],
        "email": user["email"],
        "enrollment_no": user["enrollment_no"],
        "target_role": user["target_role"],
        "daily_hours": user["daily_hours"],
        "focus_area": user["focus_area"],
        **report,
    }


@admin_bp.route("/cohort", methods=["GET"])
@admin_required
def cohort_overview():
    """Return all students with their readiness scores for the cohort table."""
    db = get_db()
    students = db.execute("SELECT id FROM users WHERE role = 'student'").fetchall()
    reports = []
    for s in students:
        try:
            reports.append(_load_student_report(s["id"], db))
        except Exception:
            pass
    db.close()

    # Aggregate KPIs
    if reports:
        avg_score = round(sum(r["overall_score"] for r in reports) / len(reports), 1)
        tier_counts = {}
        for r in reports:
            tier_counts[r["readiness_tier"]] = tier_counts.get(r["readiness_tier"], 0) + 1
        role_counts = {}
        for r in reports:
            role_counts[r["target_role"]] = role_counts.get(r["target_role"], 0) + 1
    else:
        avg_score = 0
        tier_counts = {}
        role_counts = {}

    return jsonify({
        "students": reports,
        "kpis": {
            "total_students": len(reports),
            "avg_readiness_score": avg_score,
            "tier_distribution": tier_counts,
            "role_distribution": role_counts,
        },
    }), 200


@admin_bp.route("/skill-gaps", methods=["GET"])
@admin_required
def cohort_skill_gaps():
    """Aggregate missing skills across all students for cohort skill-gap chart."""
    db = get_db()
    students = db.execute("SELECT id, target_role FROM users WHERE role = 'student'").fetchall()
    gap_counter: dict[str, int] = {}

    for s in students:
        try:
            report = _load_student_report(s["id"], db)
            for skill in report.get("missing_skills", []):
                gap_counter[skill] = gap_counter.get(skill, 0) + 1
        except Exception:
            pass
    db.close()

    # Return top 15 skill gaps sorted by frequency
    sorted_gaps = sorted(gap_counter.items(), key=lambda x: x[1], reverse=True)[:15]
    return jsonify({
        "labels": [g[0] for g in sorted_gaps],
        "counts": [g[1] for g in sorted_gaps],
    }), 200


@admin_bp.route("/export-csv", methods=["GET"])
@admin_required
def export_csv():
    """Export all student readiness data as a downloadable CSV."""
    db = get_db()
    students = db.execute("SELECT id FROM users WHERE role = 'student'").fetchall()
    reports = []
    for s in students:
        try:
            reports.append(_load_student_report(s["id"], db))
        except Exception:
            pass
    db.close()

    output = io.StringIO()
    fieldnames = [
        "name", "email", "enrollment_no", "target_role", "daily_hours",
        "focus_area", "overall_score", "readiness_tier",
        "academic_index", "skill_index", "evidence_index",
        "skill_match_pct", "project_count", "cert_count",
        "matched_skills", "missing_skills", "weak_subjects",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for r in reports:
        r["matched_skills"] = "; ".join(r.get("matched_skills", []))
        r["missing_skills"] = "; ".join(r.get("missing_skills", []))
        r["weak_subjects"] = "; ".join(r.get("weak_subjects", []))
        writer.writerow(r)

    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=studentpulse_cohort.csv"
    response.headers["Content-Type"] = "text/csv"
    return response
