# ─────────────────────────────────────────────────────────────────────────────
# backend/config.py
# Centralised application configuration loaded from .env
# ─────────────────────────────────────────────────────────────────────────────
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Flask
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-change-in-prod")
    DEBUG: bool = os.getenv("FLASK_ENV", "development") == "development"

    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", SECRET_KEY)
    JWT_EXPIRY_HOURS: int = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

    # Database
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "studentpulse.db")

    # AI Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # Institution domain
    ALLOWED_DOMAIN: str = os.getenv("ALLOWED_DOMAIN", "kiet.edu")

    # Admin seed
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "faculty@kiet.edu")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "Faculty@KIET2024")

    # AI request timeout (seconds)
    AI_TIMEOUT: int = 5


config = Config()
