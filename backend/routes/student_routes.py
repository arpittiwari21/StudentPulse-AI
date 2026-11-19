# ─────────────────────────────────────────────────────────────────────────────
# backend/routes/student_routes.py
# Student context, evidence, AI plan generation, plan editing, progress/streaks
# ─────────────────────────────────────────────────────────────────────────────
import json
from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify, g
from backend.auth import token_required
from backend.db import get_db
from backend.services.readiness_engine import compute_readiness, build_radar_data
from backend.services.ai_service import generate_ai_plan

student_bp = Blueprint("student", __name__, url_prefix="/api/student")


# ────────────────────────────────────────────────────────────────────
# Step 2 — Context & Evidence
# ────────────────────────────────────────────────────────────────────

@student_bp.route("/context", methods=["PUT"])
@token_required
def update_context():
    """Update student's target role, daily hours, and focus area."""
    data = request.get_json(silent=True) or {}
    allowed_roles = ["Full-Stack Developer", "AI/ML Engineer", "Backend Python Developer", "Data Analyst"]
    allowed_focus = ["Projects", "DSA/Coding", "Core CS", "Interview Prep"]

    target_role = data.get("target_role", "Full-Stack Developer")
    daily_hours = float(data.get("daily_hours", 2.0))
    focus_area = data.get("focus_area", "Projects")

    if target_role not in allowed_roles:
        return jsonify({"error": f"Invalid target_role. Choose from: {allowed_roles}"}), 400
    if not (0.5 <= daily_hours <= 12):
        return jsonify({"error": "daily_hours must be between 0.5 and 12."}), 400
    if focus_area not in allowed_focus:
        return jsonify({"error": f"Invalid focus_area. Choose from: {allowed_focus}"}), 400

    db = get_db()
    db.execute(
        "UPDATE users SET target_role=?, daily_hours=?, focus_area=?, last_active=datetime('now') WHERE id=?",
        (target_role, daily_hours, focus_area, g.user_id),
    )
    db.commit()
    db.close()
    return jsonify({"message": "Context updated successfully."}), 200


@student_bp.route("/assessments", methods=["GET", "POST"])
@token_required
def assessments():
    db = get_db()
    if request.method == "GET":
        rows = db.execute(
            "SELECT * FROM assessments WHERE user_id=? ORDER BY recorded_at DESC", (g.user_id,)
        ).fetchall()
        db.close()
        return jsonify([dict(r) for r in rows]), 200

    # POST — add assessment
    data = request.get_json(silent=True) or {}
    subject = (data.get("subject") or "").strip()
    score = data.get("score")
    max_score = float(data.get("max_score", 100))
    typ = data.get("type", "exam")

    if not subject:
        return jsonify({"error": "Subject name is required."}), 400
    try:
        score = float(score)
        if not (0 <= score <= max_score):
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": f"Score must be between 0 and {max_score}."}), 400

    db.execute(
        "INSERT INTO assessments (user_id, subject, score, max_score, type) VALUES (?, ?, ?, ?, ?)",
        (g.user_id, subject, score, max_score, typ),
    )
    db.commit()
    new_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    db.close()
    return jsonify({"id": new_id, "message": "Assessment recorded."}), 201


@student_bp.route("/assessments/<int:aid>", methods=["DELETE"])
@token_required
def delete_assessment(aid: int):
    db = get_db()
    existing = db.execute("SELECT id FROM assessments WHERE id=? AND user_id=?", (aid, g.user_id)).fetchone()
    if not existing:
        db.close()
        return jsonify({"error": "Assessment not found."}), 404
    db.execute("DELETE FROM assessments WHERE id=?", (aid,))
    db.commit()
    db.close()
    return jsonify({"message": "Deleted."}), 200


@student_bp.route("/projects", methods=["GET", "POST"])
@token_required
def projects():
    db = get_db()
    if request.method == "GET":
        rows = db.execute(
            "SELECT * FROM projects WHERE user_id=? ORDER BY added_at DESC", (g.user_id,)
        ).fetchall()
        db.close()
        return jsonify([dict(r) for r in rows]), 200

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Project title is required."}), 400

    complexity = data.get("complexity", "Beginner")
    if complexity not in ("Beginner", "Intermediate", "Advanced"):
        return jsonify({"error": "Complexity must be Beginner, Intermediate, or Advanced."}), 400

    db.execute(
        "INSERT INTO projects (user_id, title, description, tech_stack, complexity, github_url) VALUES (?, ?, ?, ?, ?, ?)",
        (g.user_id, title, data.get("description", ""), data.get("tech_stack", ""),
         complexity, data.get("github_url", "")),
    )
    db.commit()
    new_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    db.close()
    return jsonify({"id": new_id, "message": "Project added."}), 201


@student_bp.route("/projects/<int:pid>", methods=["DELETE"])
@token_required
def delete_project(pid: int):
    db = get_db()
    existing = db.execute("SELECT id FROM projects WHERE id=? AND user_id=?", (pid, g.user_id)).fetchone()
    if not existing:
        db.close()
        return jsonify({"error": "Project not found."}), 404
    db.execute("DELETE FROM projects WHERE id=?", (pid,))
    db.commit()
    db.close()
    return jsonify({"message": "Deleted."}), 200


@student_bp.route("/certifications", methods=["GET", "POST"])
@token_required
def certifications():
    db = get_db()
    if request.method == "GET":
        rows = db.execute(
            "SELECT * FROM certifications WHERE user_id=? ORDER BY added_at DESC", (g.user_id,)
        ).fetchall()
        db.close()
        return jsonify([dict(r) for r in rows]), 200

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Certification title is required."}), 400

    db.execute(
        "INSERT INTO certifications (user_id, title, issuer, type, issued_date) VALUES (?, ?, ?, ?, ?)",
        (g.user_id, title, data.get("issuer", ""), data.get("type", "certification"),
         data.get("issued_date", "")),
    )
    db.commit()
    new_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    db.close()
    return jsonify({"id": new_id, "message": "Certification added."}), 201


@student_bp.route("/certifications/<int:cid>", methods=["DELETE"])
@token_required
def delete_cert(cid: int):
    db = get_db()
    existing = db.execute("SELECT id FROM certifications WHERE id=? AND user_id=?", (cid, g.user_id)).fetchone()
    if not existing:
        db.close()
        return jsonify({"error": "Certification not found."}), 404
    db.execute("DELETE FROM certifications WHERE id=?", (cid,))
    db.commit()
    db.close()
    return jsonify({"message": "Deleted."}), 200


# ────────────────────────────────────────────────────────────────────
# Step 3 — Readiness Score + AI Plan Generation
# ────────────────────────────────────────────────────────────────────

@student_bp.route("/readiness", methods=["GET"])
@token_required
def get_readiness():
    """Return readiness report + radar chart data (no AI, fast)."""
    db = get_db()
    user = db.execute(
        "SELECT target_role, daily_hours, focus_area FROM users WHERE id=?", (g.user_id,)
    ).fetchone()
    assessments = [dict(r) for r in db.execute("SELECT * FROM assessments WHERE user_id=?", (g.user_id,)).fetchall()]
    projects = [dict(r) for r in db.execute("SELECT * FROM projects WHERE user_id=?", (g.user_id,)).fetchall()]
    certs = [dict(r) for r in db.execute("SELECT * FROM certifications WHERE user_id=?", (g.user_id,)).fetchall()]
    db.close()

    report = compute_readiness(
        assessments=assessments,
        projects=projects,
        certifications=certs,
        target_role=user["target_role"] or "Full-Stack Developer",
        daily_hours=user["daily_hours"] or 2.0,
    )
    radar = build_radar_data(report, assessments)
    return jsonify({"readiness": report, "radar": radar}), 200


@student_bp.route("/generate-plan", methods=["POST"])
@token_required
def generate_plan():
    """
    Run full readiness scoring + AI plan generation.
    Deactivates previous plans and saves new one to DB.
    """
    db = get_db()
    user = db.execute(
        "SELECT target_role, daily_hours, focus_area FROM users WHERE id=?", (g.user_id,)
    ).fetchone()
    assessments = [dict(r) for r in db.execute("SELECT * FROM assessments WHERE user_id=?", (g.user_id,)).fetchall()]
    projects = [dict(r) for r in db.execute("SELECT * FROM projects WHERE user_id=?", (g.user_id,)).fetchall()]
    certs = [dict(r) for r in db.execute("SELECT * FROM certifications WHERE user_id=?", (g.user_id,)).fetchall()]

    report = compute_readiness(
        assessments=assessments,
        projects=projects,
        certifications=certs,
        target_role=user["target_role"] or "Full-Stack Developer",
        daily_hours=user["daily_hours"] or 2.0,
    )
    radar = build_radar_data(report, assessments)

    # Generate AI plan (with timeout + fallback)
    ai_result = generate_ai_plan(
        target_role=report["target_role"],
        daily_hours=user["daily_hours"] or 2.0,
        focus_area=user["focus_area"] or "Projects",
        missing_skills=report["missing_skills"],
        weak_subjects=report["weak_subjects"],
        projects=projects,
        overall_score=report["overall_score"],
        readiness_tier=report["readiness_tier"],
    )

    # Deactivate previous plans
    db.execute("UPDATE action_plans SET is_active=0 WHERE user_id=?", (g.user_id,))

    # Save plan
    db.execute(
        """INSERT INTO action_plans
           (user_id, overall_score, readiness_tier, diagnosis, milestones, interview_qs)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (
            g.user_id,
            report["overall_score"],
            report["readiness_tier"],
            ai_result.get("readiness_explanation", ""),
            json.dumps(ai_result.get("action_plan", [])),
            json.dumps(ai_result.get("interview_questions", [])),
        ),
    )
    db.commit()
    plan_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]

    # Persist tasks into plan_tasks
    for milestone in ai_result.get("action_plan", []):
        m_num = milestone.get("milestone", 1)
        for idx, task in enumerate(milestone.get("tasks", [])):
            from datetime import datetime, timedelta
            target_date = (datetime.now() + timedelta(days=task.get("target_days", 14))).strftime("%Y-%m-%d")
            db.execute(
                """INSERT INTO plan_tasks
                   (plan_id, user_id, milestone, title, description, priority, target_date, sort_order)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (plan_id, g.user_id, m_num,
                 task.get("title", "Task"),
                 task.get("description", ""),
                 task.get("priority", "Medium"),
                 target_date, idx),
            )
    db.commit()
    db.close()

    return jsonify({
        "plan_id": plan_id,
        "readiness": report,
        "radar": radar,
        "diagnosis": ai_result.get("readiness_explanation", ""),
        "action_plan": ai_result.get("action_plan", []),
        "interview_questions": ai_result.get("interview_questions", []),
        "ai_source": ai_result.get("source", "offline_fallback"),
    }), 200


# ────────────────────────────────────────────────────────────────────
# Step 4 — Plan Review & Modification
# ────────────────────────────────────────────────────────────────────

@student_bp.route("/plan", methods=["GET"])
@token_required
def get_plan():
    """Return active plan with all tasks."""
    db = get_db()
    plan = db.execute(
        "SELECT * FROM action_plans WHERE user_id=? AND is_active=1 ORDER BY generated_at DESC LIMIT 1",
        (g.user_id,),
    ).fetchone()
    if not plan:
        db.close()
        return jsonify({"plan": None, "tasks": []}), 200

    tasks = db.execute(
        "SELECT * FROM plan_tasks WHERE plan_id=? ORDER BY milestone, sort_order",
        (plan["id"],),
    ).fetchall()
    db.close()

    return jsonify({
        "plan": {
            "id": plan["id"],
            "overall_score": plan["overall_score"],
            "readiness_tier": plan["readiness_tier"],
            "diagnosis": plan["diagnosis"],
            "interview_questions": json.loads(plan["interview_qs"] or "[]"),
            "generated_at": plan["generated_at"],
        },
        "tasks": [dict(t) for t in tasks],
    }), 200


@student_bp.route("/plan/tasks", methods=["POST"])
@token_required
def add_task():
    """Add a custom task to the active plan."""
    db = get_db()
    plan = db.execute(
        "SELECT id FROM action_plans WHERE user_id=? AND is_active=1 ORDER BY generated_at DESC LIMIT 1",
        (g.user_id,),
    ).fetchone()
    if not plan:
        db.close()
        return jsonify({"error": "No active plan found. Generate a plan first."}), 404

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Task title is required."}), 400

    milestone = int(data.get("milestone", 1))
    if milestone not in (1, 2, 3, 4):
        return jsonify({"error": "Milestone must be 1, 2, 3, or 4."}), 400

    priority = data.get("priority", "Medium")
    if priority not in ("High", "Medium", "Low"):
        return jsonify({"error": "Priority must be High, Medium, or Low."}), 400

    max_order = db.execute(
        "SELECT COALESCE(MAX(sort_order), 0) FROM plan_tasks WHERE plan_id=? AND milestone=?",
        (plan["id"], milestone),
    ).fetchone()[0]

    db.execute(
        """INSERT INTO plan_tasks
           (plan_id, user_id, milestone, title, description, priority, target_date, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (plan["id"], g.user_id, milestone, title,
         data.get("description", ""), priority,
         data.get("target_date", ""), max_order + 1),
    )
    db.commit()
    new_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    db.close()
    return jsonify({"id": new_id, "message": "Custom task added."}), 201


@student_bp.route("/plan/tasks/<int:tid>", methods=["PATCH", "DELETE"])
@token_required
def update_or_delete_task(tid: int):
    db = get_db()
    task = db.execute("SELECT * FROM plan_tasks WHERE id=? AND user_id=?", (tid, g.user_id)).fetchone()
    if not task:
        db.close()
        return jsonify({"error": "Task not found."}), 404

    if request.method == "DELETE":
        db.execute("DELETE FROM plan_tasks WHERE id=?", (tid,))
        db.commit()
        db.close()
        return jsonify({"message": "Task deleted."}), 200

    # PATCH — update fields
    data = request.get_json(silent=True) or {}
    fields: list[tuple] = []
    if "title" in data and data["title"].strip():
        fields.append(("title", data["title"].strip()))
    if "description" in data:
        fields.append(("description", data["description"]))
    if "priority" in data and data["priority"] in ("High", "Medium", "Low"):
        fields.append(("priority", data["priority"]))
    if "target_date" in data:
        fields.append(("target_date", data["target_date"]))
    if "completed" in data:
        fields.append(("completed", 1 if data["completed"] else 0))
    if "sort_order" in data:
        fields.append(("sort_order", int(data["sort_order"])))

    if not fields:
        db.close()
        return jsonify({"error": "No valid fields to update."}), 400

    set_clause = ", ".join(f"{f}=?" for f, _ in fields)
    values = [v for _, v in fields] + [tid]
    db.execute(f"UPDATE plan_tasks SET {set_clause}, updated_at=datetime('now') WHERE id=?", values)
    db.commit()

    # Log progress if task was completed
    if ("completed", 1) in fields:
        today = date.today().isoformat()
        db.execute(
            """INSERT INTO progress_logs (user_id, log_date, tasks_done) VALUES (?, ?, 1)
               ON CONFLICT(user_id, log_date) DO UPDATE SET tasks_done = tasks_done + 1""",
            (g.user_id, today),
        )
        db.commit()

    db.close()
    return jsonify({"message": "Task updated."}), 200


# ────────────────────────────────────────────────────────────────────
# Step 5 — Progress & Streak Tracking
# ────────────────────────────────────────────────────────────────────

@student_bp.route("/progress", methods=["GET"])
@token_required
def get_progress():
    """Return streak data, weekly bar chart, and task completion summary."""
    db = get_db()

    # Last 30 days of activity
    logs = db.execute(
        """SELECT log_date, tasks_done, score_snap FROM progress_logs
           WHERE user_id=? ORDER BY log_date DESC LIMIT 30""",
        (g.user_id,),
    ).fetchall()
    logs_list = [dict(r) for r in logs]

    # Streak calculation
    streak = 0
    active_dates = {r["log_date"] for r in logs_list if r["tasks_done"] > 0}
    today = date.today()
    check = today
    while check.isoformat() in active_dates:
        streak += 1
        check -= timedelta(days=1)

    # Active days (last 30)
    active_days = len(active_dates)

    # Weekly progress (last 7 days)
    weekly = []
    for i in range(6, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        entry = next((r for r in logs_list if r["log_date"] == d), None)
        weekly.append({"date": d, "tasks_done": entry["tasks_done"] if entry else 0})

    # Task completion stats
    plan = db.execute(
        "SELECT id FROM action_plans WHERE user_id=? AND is_active=1 ORDER BY generated_at DESC LIMIT 1",
        (g.user_id,),
    ).fetchone()

    total_tasks = completed_tasks = 0
    if plan:
        total_tasks = db.execute(
            "SELECT COUNT(*) FROM plan_tasks WHERE plan_id=?", (plan["id"],)
        ).fetchone()[0]
        completed_tasks = db.execute(
            "SELECT COUNT(*) FROM plan_tasks WHERE plan_id=? AND completed=1", (plan["id"],)
        ).fetchone()[0]

    # Score history for progress line chart
    score_history = [
        {"date": r["log_date"], "score": r["score_snap"]}
        for r in reversed(logs_list)
        if r["score_snap"] is not None
    ]

    db.close()

    return jsonify({
        "streak": streak,
        "active_days": active_days,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "completion_pct": round((completed_tasks / total_tasks * 100) if total_tasks else 0, 1),
        "weekly_data": weekly,
        "score_history": score_history,
    }), 200
