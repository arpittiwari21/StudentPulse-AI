# ─────────────────────────────────────────────────────────────────────────────
# backend/auth.py
# JWT authentication helpers + route decorators
# ─────────────────────────────────────────────────────────────────────────────
import jwt
import hashlib
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, g
from backend.config import config
from backend.db import get_db


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _make_token(user_id: int, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=config.JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, config.JWT_SECRET, algorithm="HS256")


def _decode_token(token: str) -> dict:
    return jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])


def _extract_bearer() -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None


# ---------------------------------------------------------------------------
# Decorators
# ---------------------------------------------------------------------------

def token_required(f):
    """Inject g.user_id and g.role from a valid JWT."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = _extract_bearer()
        if not token:
            return jsonify({"error": "Authentication required. Please log in."}), 401
        try:
            payload = _decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid authentication token."}), 401

        db = get_db()
        user = db.execute("SELECT id, role FROM users WHERE id = ?", (payload["sub"],)).fetchone()
        db.close()
        if not user:
            return jsonify({"error": "User not found."}), 401

        g.user_id = user["id"]
        g.role = user["role"]
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Restrict endpoint to faculty / admin role."""
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if g.role != "faculty":
            return jsonify({"error": "Faculty access required."}), 403
        return f(*args, **kwargs)
    return decorated


# ---------------------------------------------------------------------------
# Auth logic (called from routes)
# ---------------------------------------------------------------------------

def register_user(name: str, email: str, enrollment_no: str, password: str) -> dict:
    """Validate domain, check duplicates, create user, return token."""
    email = email.strip().lower()
    domain = email.split("@")[-1] if "@" in email else ""
    if domain != config.ALLOWED_DOMAIN:
        return {"error": f"Only @{config.ALLOWED_DOMAIN} email addresses are allowed."}

    if not name or len(name) < 2:
        return {"error": "Name must be at least 2 characters."}
    if not password or len(password) < 6:
        return {"error": "Password must be at least 6 characters."}

    db = get_db()
    if db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
        db.close()
        return {"error": "An account with this email already exists."}

    db.execute(
        "INSERT INTO users (name, email, enrollment_no, password_hash, role) VALUES (?, ?, ?, ?, 'student')",
        (name, email, enrollment_no or None, _hash(password)),
    )
    db.commit()
    uid = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    db.close()

    token = _make_token(uid, "student")
    return {"token": token, "user_id": uid, "role": "student", "name": name}


def login_user(email: str, password: str) -> dict:
    """Verify credentials, return token."""
    email = email.strip().lower()
    db = get_db()
    user = db.execute(
        "SELECT id, name, role, password_hash FROM users WHERE email = ?", (email,)
    ).fetchone()
    db.close()

    if not user or user["password_hash"] != _hash(password):
        return {"error": "Incorrect email or password."}

    token = _make_token(user["id"], user["role"])
    return {
        "token": token,
        "user_id": user["id"],
        "role": user["role"],
        "name": user["name"],
    }
