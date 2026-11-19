# ─────────────────────────────────────────────────────────────────────────────
# tests/test_api.py
# Python unittest suite — auth, scoring engine, plan management, AI fallback
# Run:  python -m pytest tests/ -v   OR   python -m unittest discover tests/
# ─────────────────────────────────────────────────────────────────────────────
import unittest
import json
import os
import sys
import tempfile

# Add parent dir to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Use an in-memory test database
os.environ["DATABASE_PATH"] = ":memory:"
os.environ["GEMINI_API_KEY"] = ""   # Force offline fallback for tests
os.environ["GROQ_API_KEY"] = ""


class TestReadinessEngine(unittest.TestCase):
    """Unit tests for the pure Python scoring engine."""

    def setUp(self):
        from backend.services.readiness_engine import compute_readiness, build_radar_data
        self.compute = compute_readiness
        self.build_radar = build_radar_data

    def _sample_data(self):
        return {
            "assessments": [
                {"subject": "Python", "score": 85, "max_score": 100, "type": "exam"},
                {"subject": "Machine Learning", "score": 78, "max_score": 100, "type": "quiz"},
            ],
            "projects": [
                {"title": "NLP App", "tech_stack": "python,bert,nlp,tensorflow", "description": "NLP sentiment", "complexity": "Advanced"},
            ],
            "certifications": [
                {"title": "Google AI Essentials", "issuer": "Google", "type": "certification"},
            ],
        }

    def test_compute_returns_required_keys(self):
        d = self._sample_data()
        report = self.compute(
            assessments=d["assessments"], projects=d["projects"],
            certifications=d["certifications"], target_role="AI/ML Engineer",
        )
        for key in ["overall_score", "readiness_tier", "academic_index",
                    "skill_index", "evidence_index", "matched_skills",
                    "missing_skills", "weak_subjects", "skill_match_pct"]:
            self.assertIn(key, report, f"Missing key: {key}")

    def test_score_is_in_valid_range(self):
        d = self._sample_data()
        report = self.compute(**d, target_role="AI/ML Engineer")
        self.assertGreaterEqual(report["overall_score"], 0)
        self.assertLessEqual(report["overall_score"], 100)

    def test_readiness_tier_valid(self):
        d = self._sample_data()
        report = self.compute(**d, target_role="AI/ML Engineer")
        self.assertIn(report["readiness_tier"], ["Industry Ready", "Developing", "Needs Foundation"])

    def test_no_data_returns_fallback_score(self):
        report = self.compute(assessments=[], projects=[], certifications=[], target_role="Data Analyst")
        self.assertIsInstance(report["overall_score"], float)
        self.assertGreater(report["overall_score"], 0)

    def test_weak_subjects_identified(self):
        """Subjects below 70% should appear in weak_subjects."""
        report = self.compute(
            assessments=[{"subject": "Maths", "score": 55, "max_score": 100, "type": "exam"}],
            projects=[], certifications=[], target_role="AI/ML Engineer",
        )
        self.assertIn("Maths", report["weak_subjects"])

    def test_advanced_project_scores_higher(self):
        base = {"assessments": [], "certifications": [], "target_role": "Full-Stack Developer"}
        r_beginner = self.compute(projects=[{"title": "T", "tech_stack": "python", "description": "", "complexity": "Beginner"}], **base)
        r_advanced = self.compute(projects=[{"title": "T", "tech_stack": "python", "description": "", "complexity": "Advanced"}], **base)
        self.assertGreater(r_advanced["evidence_index"], r_beginner["evidence_index"])

    def test_radar_data_has_5_axes(self):
        d = self._sample_data()
        report = self.compute(**d, target_role="AI/ML Engineer")
        radar = self.build_radar(report, d["assessments"])
        self.assertEqual(len(radar["labels"]), 5)
        self.assertEqual(len(radar["scores"]), 5)

    def test_all_roles_compute_without_error(self):
        roles = ["Full-Stack Developer", "AI/ML Engineer", "Backend Python Developer", "Data Analyst"]
        for role in roles:
            with self.subTest(role=role):
                report = self.compute(assessments=[], projects=[], certifications=[], target_role=role)
                self.assertIn("overall_score", report)

    def test_skill_match_in_range(self):
        d = self._sample_data()
        report = self.compute(**d, target_role="AI/ML Engineer")
        self.assertGreaterEqual(report["skill_match_pct"], 0)
        self.assertLessEqual(report["skill_match_pct"], 100)


class TestAIFallback(unittest.TestCase):
    """Unit tests for deterministic AI fallback (no API keys)."""

    def setUp(self):
        from backend.services.ai_service import generate_ai_plan, _make_fallback, _validate
        self.generate = generate_ai_plan
        self.make_fallback = _make_fallback
        self.validate = _validate

    def test_fallback_has_required_keys(self):
        result = self.make_fallback(
            target_role="Full-Stack Developer", daily_hours=2.0,
            missing_skills=["react", "nodejs"], weak_subjects=["algorithms"],
            overall_score=55.0, readiness_tier="Developing",
        )
        self.assertIn("readiness_explanation", result)
        self.assertIn("action_plan", result)
        self.assertIn("interview_questions", result)

    def test_fallback_has_4_milestones(self):
        result = self.make_fallback(
            target_role="AI/ML Engineer", daily_hours=1.0,
            missing_skills=[], weak_subjects=[],
            overall_score=40.0, readiness_tier="Needs Foundation",
        )
        self.assertEqual(len(result["action_plan"]), 4)

    def test_fallback_has_6_interview_questions(self):
        result = self.make_fallback(
            target_role="Data Analyst", daily_hours=3.0,
            missing_skills=["sql"], weak_subjects=[],
            overall_score=65.0, readiness_tier="Developing",
        )
        self.assertEqual(len(result["interview_questions"]), 6)

    def test_fallback_works_for_all_roles(self):
        roles = ["Full-Stack Developer", "AI/ML Engineer", "Backend Python Developer", "Data Analyst"]
        for role in roles:
            with self.subTest(role=role):
                result = self.make_fallback(role, 2.0, [], [], 50.0, "Developing")
                self.assertTrue(self.validate(result))

    def test_generate_plan_offline_always_returns_valid(self):
        """With no API keys, should always return a valid fallback plan."""
        result = self.generate(
            target_role="Full-Stack Developer", daily_hours=2.0,
            focus_area="Projects", missing_skills=["react"],
            weak_subjects=[], projects=[], overall_score=60.0,
            readiness_tier="Developing",
        )
        self.assertTrue(self.validate(result))
        self.assertEqual(result.get("source"), "offline_fallback")

    def test_validate_rejects_incomplete_response(self):
        self.assertFalse(self.validate({}))
        self.assertFalse(self.validate({"readiness_explanation": "ok"}))
        self.assertFalse(self.validate({
            "readiness_explanation": "ok",
            "action_plan": "not a list",
            "interview_questions": [],
        }))

    def test_industry_ready_diagnosis(self):
        result = self.make_fallback("Full-Stack Developer", 4.0, [], [], 85.0, "Industry Ready")
        self.assertIn("85", result["readiness_explanation"])

    def test_needs_foundation_diagnosis_mentions_gaps(self):
        result = self.make_fallback("AI/ML Engineer", 1.0, ["tensorflow", "bert"], [], 35.0, "Needs Foundation")
        self.assertIn("tensorflow", result["readiness_explanation"].lower())


class TestFlaskApp(unittest.TestCase):
    """Integration tests for the Flask API endpoints."""

    @classmethod
    def setUpClass(cls):
        # Use a named temp file so SQLite can persist within the test session
        cls._db_fd, cls._db_path = tempfile.mkstemp(suffix=".db")
        os.environ["DATABASE_PATH"] = cls._db_path
        from backend import config as _cfg_mod
        _cfg_mod.config.DATABASE_PATH = cls._db_path
        from backend.app import create_app
        cls.app = create_app()
        cls.app.config["TESTING"] = True
        cls.client = cls.app.test_client()

    @classmethod
    def tearDownClass(cls):
        import os as _os
        try:
            _os.close(cls._db_fd)
            _os.unlink(cls._db_path)
        except Exception:
            pass

    def test_health_endpoint(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data["status"], "ok")

    def test_register_requires_kiet_email(self):
        res = self.client.post(
            "/api/auth/register",
            json={"name": "Test", "email": "test@gmail.com", "password": "Test@123"},
        )
        self.assertEqual(res.status_code, 400)
        data = json.loads(res.data)
        self.assertIn("kiet.edu", data["error"])

    def test_register_and_login_flow(self):
        import time
        unique = str(int(time.time()))[-6:]
        email = f"testuser{unique}@kiet.edu"

        # Register
        res = self.client.post(
            "/api/auth/register",
            json={"name": "Test User", "email": email, "password": "Test@1234"},
        )
        self.assertEqual(res.status_code, 201)
        data = json.loads(res.data)
        self.assertIn("token", data)
        token = data["token"]

        # Login
        res2 = self.client.post(
            "/api/auth/login",
            json={"email": email, "password": "Test@1234"},
        )
        self.assertEqual(res2.status_code, 200)
        data2 = json.loads(res2.data)
        self.assertIn("token", data2)

        # /me with token
        res3 = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res3.status_code, 200)
        data3 = json.loads(res3.data)
        self.assertEqual(data3["email"], email)

    def test_login_wrong_password(self):
        # First register
        import time
        email = f"wrongpw{int(time.time())%10000}@kiet.edu"
        self.client.post("/api/auth/register",
            json={"name": "WP", "email": email, "password": "Right@Pass"})

        res = self.client.post("/api/auth/login",
            json={"email": email, "password": "WrongPass"})
        self.assertEqual(res.status_code, 401)

    def test_protected_route_requires_token(self):
        res = self.client.get("/api/student/readiness")
        self.assertEqual(res.status_code, 401)

    def test_context_update(self):
        import time
        email = f"ctx{int(time.time())%10000}@kiet.edu"
        reg = self.client.post("/api/auth/register",
            json={"name": "CTX", "email": email, "password": "Ctx@1234"})
        token = json.loads(reg.data)["token"]

        res = self.client.put(
            "/api/student/context",
            json={"target_role": "AI/ML Engineer", "daily_hours": 3.0, "focus_area": "Projects"},
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)

    def test_context_rejects_invalid_role(self):
        import time
        email = f"inv{int(time.time())%10000}@kiet.edu"
        reg = self.client.post("/api/auth/register",
            json={"name": "INV", "email": email, "password": "Inv@1234"})
        token = json.loads(reg.data)["token"]

        res = self.client.put(
            "/api/student/context",
            json={"target_role": "Hacker", "daily_hours": 2.0, "focus_area": "Projects"},
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 400)

    def test_add_assessment(self):
        import time
        email = f"assess{int(time.time())%10000}@kiet.edu"
        reg = self.client.post("/api/auth/register",
            json={"name": "ASS", "email": email, "password": "Ass@1234"})
        token = json.loads(reg.data)["token"]

        res = self.client.post(
            "/api/student/assessments",
            json={"subject": "Python", "score": 88, "max_score": 100, "type": "exam"},
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 201)

    def test_generate_plan_offline(self):
        import time
        email = f"plan{int(time.time())%10000}@kiet.edu"
        reg = self.client.post("/api/auth/register",
            json={"name": "PLN", "email": email, "password": "Pln@1234"})
        token = json.loads(reg.data)["token"]

        # Add some data first
        self.client.post("/api/student/assessments",
            json={"subject": "Python", "score": 80, "max_score": 100, "type": "exam"},
            headers={"Authorization": f"Bearer {token}"})

        res = self.client.post(
            "/api/student/generate-plan",
            json={},
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("readiness", data)
        self.assertIn("action_plan", data)
        self.assertEqual(data["ai_source"], "offline_fallback")

    def test_faculty_cannot_access_without_role(self):
        import time
        email = f"stufac{int(time.time())%10000}@kiet.edu"
        reg = self.client.post("/api/auth/register",
            json={"name": "STU", "email": email, "password": "Stu@1234"})
        token = json.loads(reg.data)["token"]

        res = self.client.get(
            "/api/admin/cohort",
            headers={"Authorization": f"Bearer {token}"},
        )
        self.assertEqual(res.status_code, 403)

    def test_spa_serves_index(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn(b"StudentPulse", res.data)


if __name__ == "__main__":
    unittest.main(verbosity=2)
