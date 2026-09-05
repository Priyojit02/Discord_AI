import json
import re
from typing import List
from ..core.config import get_llm
from ..core.logger import logger
from ..models.message import MessageItem

class ReplyService:
    """Service generating contextual smart quick replies."""

    @classmethod
    def generate_replies(cls, messages: List[MessageItem], channel_name: str = "channel") -> List[str]:
        valid_msgs = [m for m in messages if m.content and m.content.strip()]
        if not valid_msgs:
            return ["Hey everyone! 👋", "What are you working on today?", "Hop in voice! 🎧"]

        # 1. Attempt LLM generation via AWS Bedrock (Claude Sonnet)
        llm = get_llm(temperature=0.3, max_tokens=200)
        if llm:
            try:
                last_few = "\n".join([f"{m.sender}: {m.content}" for m in valid_msgs[-5:]])
                prompt = f"""You are Clyde, a helpful Discord AI.
Based on the latest messages in Discord channel #{channel_name}, generate 3-4 natural, conversational quick replies a user might want to send with 1 click. Keep them punchy and Discord-friendly (emoji included).

MESSAGES:
{last_few}

Return ONLY a JSON array of 3 or 4 strings, e.g. ["Reply 1", "Reply 2", "Reply 3"] without any other text or markdown.
"""
                resp = llm.invoke(prompt)
                raw_text = resp.content if isinstance(resp.content, str) else str(resp.content)
                array_match = re.search(r"\[.*\]", raw_text, re.DOTALL)
                if array_match:
                    replies = json.loads(array_match.group(0))
                    if isinstance(replies, list) and len(replies) >= 2:
                        return [str(r).strip() for r in replies[:4]]
            except Exception as e:
                logger.warning(f"Bedrock smart replies generation failed: {e}")

        # 2. Rule-based fallback
        return cls._rule_based_replies(valid_msgs)

    @staticmethod
    def _rule_based_replies(messages: List[MessageItem]) -> List[str]:
        last_text = messages[-1].content.lower()

        if any(k in last_text for k in ["invite", "join", "server", "link"]):
            return [
                "Joined! Thanks for the invite! 🎉",
                "Awesome server! Looking around now.",
                "Inviting a few friends to join too! 🚀",
            ]
        if any(k in last_text for k in ["voice", "call", "screen", "mic"]):
            return [
                "Joining General Voice now! 🎧",
                "Give me 2 minutes and I will hop in! ⏱️",
                "Mic ready, let's start! 🎙️",
            ]
        if "?" in last_text or any(k in last_text for k in ["how", "when", "where", "what", "who"]):
            return [
                "Sounds like a great plan! 👍",
                "Let me check and get back to you shortly.",
                "I agree with that completely.",
            ]
        if any(k in last_text for k in ["hi", "hello", "hey", "sup"]):
            return [
                "Hey! How is everything going? 👋",
                "Hello there! Ready for voice call? 🎮",
                "Hey! What's the plan today? ✨",
            ]

        return [
            "Sounds good! 👍",
            "Awesome, thanks for the update! 🚀",
            "Could you clarify that a bit?",
            "Let us hop in voice to talk! 🎙️",
        ]
