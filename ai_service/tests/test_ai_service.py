import unittest
import sys
import os

# Ensure ai_service root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from starlette.testclient import TestClient
from main import app

class TestAIServiceMVC(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("service", data)
        self.assertIn("engine", data)

    def test_summarize_empty(self):
        res = self.client.post("/api/ai/summarize", json={"messages": [], "channelName": "general"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("quiet", data["overview"].lower())
        self.assertTrue(len(data["smartReplies"]) > 0)

    def test_summarize_with_messages(self):
        messages = [
            {"sender": "Priyojit26", "content": "Hey everyone! Anyone free for group voice call?"},
            {"sender": "Priyo24", "content": "Yes! Joining the general voice channel now."},
            {"sender": "Priyo24", "content": "Check out the server invite link: http://localhost:3000/invite/test"},
        ]
        res = self.client.post("/api/ai/summarize", json={"messages": messages, "channelName": "gaming"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("overview", data)
        self.assertIn("keyPoints", data)
        self.assertIn("actionItems", data)
        self.assertTrue(len(data["keyPoints"]) > 0)

    def test_smart_replies(self):
        messages = [{"sender": "Priyo", "content": "Can you jump on the voice call?"}]
        res = self.client.post("/api/ai/smart-replies", json={"messages": messages})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("replies", data)
        self.assertTrue(len(data["replies"]) >= 2)

    def test_draft_enhancer(self):
        payload = {"text": "we need to push the code today", "style": "discord"}
        res = self.client.post("/api/ai/draft", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("enhanced", data)
        self.assertTrue(len(data["enhanced"]) > 5)

        # Test bullet points
        payload_bp = {"text": "task 1, task 2, task 3", "style": "bullet_points"}
        res_bp = self.client.post("/api/ai/draft", json=payload_bp)
        self.assertEqual(res_bp.status_code, 200)
        self.assertIn("•", res_bp.json()["enhanced"])

    def test_clyde_query_poll(self):
        payload = {"prompt": "/ai poll What game should we play?", "channelName": "general"}
        res = self.client.post("/api/ai/query", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("Poll", data["reply"])
        self.assertIn("1️⃣", data["reply"])

    def test_channel_insights(self):
        messages = [
            {"sender": "Alex", "content": "Awesome job team, this is superb and fire! 🔥"},
            {"sender": "Jordan", "content": "Love the new calling features and audio quality!"}
        ]
        res = self.client.post("/api/ai/insights", json={"messages": messages, "channelName": "general"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("insights", data)
        self.assertGreaterEqual(data["insights"]["score"], 0)
        self.assertEqual(data["insights"]["activeSpeakers"], 2)

if __name__ == "__main__":
    unittest.main()
