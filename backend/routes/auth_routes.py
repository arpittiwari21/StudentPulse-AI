# ─────────────────────────────────────────────────────────────────────────────
# backend/routes/auth_routes.py
# /api/auth — register, login, /me (profile)
# ─────────────────────────────────────────────────────────────────────────────
from flask import Blueprint, request, jsonify, g
from backend.auth import register_user, login_user, token_required
from backend.db import get_db

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    enrollment_no = (data.get("enrollment_no") or "").strip()
    password = data.get("password") or ""

    if not all([name, email, password]):
        return jsonify({"error": "Name, email, and password are required."}), 400

    result = register_user(name, email, enrollment_no, password)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    result = login_user(email, password)
    if "error" in result:
        return jsonify(result), 401
    return jsonify(result), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    db = get_db()
    user = db.execute(
        "SELECT id, name, email, enrollment_no, role, target_role, daily_hours, focus_area, created_at FROM users WHERE id = ?",
        (g.user_id,),
    ).fetchone()
    db.close()
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify(dict(user)), 200
