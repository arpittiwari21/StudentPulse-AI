# ─────────────────────────────────────────────────────────────────────────────
# backend/app.py
# Flask application factory — wires blueprints, CORS, static SPA serving
# ─────────────────────────────────────────────────────────────────────────────
import os
import sys

# Ensure both project root and backend dir are in sys.path regardless of execution working dir
_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_PARENT_DIR = os.path.abspath(os.path.join(_CURRENT_DIR, ".."))
if _PARENT_DIR not in sys.path:
    sys.path.insert(0, _PARENT_DIR)
if _CURRENT_DIR not in sys.path:
    sys.path.insert(0, _CURRENT_DIR)

import logging
from flask import Flask, send_from_directory
from flask_cors import CORS

from backend.config import config
from backend.db import init_db
from backend.routes.auth_routes import auth_bp
from backend.routes.student_routes import student_bp
from backend.routes.admin_routes import admin_bp

logging.basicConfig(
    level=logging.DEBUG if config.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

FRONTEND_DIR = os.path.join(_PARENT_DIR, "frontend")


def create_app() -> Flask:
    app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
    app.config["SECRET_KEY"] = config.SECRET_KEY
    app.config["DEBUG"] = config.DEBUG

    # CORS — allow all origins in development
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialise database (idempotent)
    with app.app_context():
        init_db()
        logger.info("Database initialised ✓")

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(admin_bp)

    # Health check
    @app.route("/api/health")
    def health():
        return {"status": "ok", "app": "StudentPulse AI", "version": "1.0.0"}

    # Serve SPA — all non-API routes serve index.html
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_spa(path):
        if path.startswith("api/"):
            from flask import abort
            abort(404)
        file_path = os.path.join(FRONTEND_DIR, path)
        if path and os.path.exists(file_path):
            return send_from_directory(FRONTEND_DIR, path)
        return send_from_directory(FRONTEND_DIR, "index.html")

    return app


# WSGI application instance (accessible as app:app or wsgi:app)
app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=config.DEBUG)
