import json
import re
from typing import List, Tuple
from ..core.config import get_llm
from ..core.logger import logger
from ..models.message import MessageItem

class SummarizerService:
    """Service handling multi-message channel summarization using Bedrock with heuristic fallback."""

    @classmethod
    def summarize(
        cls,
        messages: List[MessageItem],
        channel_name: str = "channel"
    ) -> Tuple[str, List[str], List[str], List[str]]:
        """
        Returns: (overview, key_points, action_items, smart_replies)
        """
        valid_msgs = [m for m in messages if m.content and m.content.strip()]
        if not valid_msgs:
            return (
                f"No recent messages in #{channel_name}. The channel is currently quiet.",
                ["The channel is currently quiet."],
                ["Post a message or invite teammates to begin conversation."],
                ["Hey everyone! 👋", "What is everyone playing today?", "Free for a group voice call? 🎙️"],
            )

        # 1. Attempt LLM generation via AWS Bedrock (Claude Sonnet)
        llm = get_llm(temperature=0.2, max_tokens=1000)
        if llm:
            try:
                transcript = "\n".join([f"{m.sender}: {m.content}" for m in valid_msgs[-20:]])
                prompt = f"""You are Clyde, an intelligent Discord AI assistant.
Analyze the following messages from Discord channel #{channel_name} and generate a structured JSON summary.

MESSAGES:
{transcript}

Return ONLY valid JSON in this exact structure without markdown backticks:
{{
  "overview": "A 1-2 sentence executive summary of what members discussed.",
  "keyPoints": ["Highlight 1", "Highlight 2", "Highlight 3"],
  "actionItems": ["Actionable next step 1", "Actionable next step 2"],
  "smartReplies": ["Quick reply 1", "Quick reply 2", "Quick reply 3"]
}}
"""
                resp = llm.invoke(prompt)
                raw_text = resp.content if isinstance(resp.content, str) else str(resp.content)
                
                # Parse JSON
                json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group(0))
                    overview = data.get("overview", "")
                    key_points = data.get("keyPoints", [])
                    action_items = data.get("actionItems", [])
                    smart_replies = data.get("smartReplies", [])
                    if overview and key_points:
                        return (overview, key_points, action_items, smart_replies)
            except Exception as e:
                logger.warning(f"Bedrock summarization failed, switching to local NLP: {e}")

        # 2. Heuristic fallback
        return cls._heuristic_summarize(valid_msgs, channel_name)

    @staticmethod
    def _heuristic_summarize(
        messages: List[MessageItem],
        channel_name: str
    ) -> Tuple[str, List[str], List[str], List[str]]:
        count = len(messages)
        recent = messages[-15:]
        senders = list(dict.fromkeys(m.sender for m in recent))
        questions = [m for m in recent if "?" in m.content]
        links = [m for m in recent if "http" in m.content or "/invite/" in m.content]

        overview = (
            f"Digest for #{channel_name}: Analyzed {count} recent message(s) from {len(senders)} active participant(s) "
            f"({', '.join(senders[:4])}). Found {len(questions)} question(s) and {len(links)} shared link(s)."
        )

        key_points = []
        for m in recent[-6:]:
            clean = m.content[:75] + ("..." if len(m.content) > 75 else "")
            key_points.append(f"**{m.sender}**: \"{clean}\"")

        action_items = []
        if links:
            action_items.append("Review shared server invite links or media attachments.")
        if questions:
            last_q = questions[-1]
            action_items.append(f"Follow up on question asked by {last_q.sender}: \"{last_q.content[:50]}...\"")
        else:
            action_items.append("Hop into the General Voice channel for a live group audio/video session.")

        smart_replies = [
            "Sounds good to me! 👍",
            "Let's hop on voice to discuss! 🎙️",
            "Checking it out right now! 🚀",
        ]

        return (overview, key_points, action_items, smart_replies)
