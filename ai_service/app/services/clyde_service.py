import re
from typing import List, Optional, Tuple
from ..core.config import get_llm, settings
from ..core.logger import logger
from ..models.message import MessageItem
from ..views.discord_formatters import DiscordFormatter
from .summarizer_service import SummarizerService

class ClydeBotService:
    """Conversational Clyde AI Bot powered by Claude Sonnet via AWS Bedrock with Discord formatting."""

    @classmethod
    def process_query(
        cls,
        prompt: str,
        channel_name: str = "channel",
        recent_messages: Optional[List[MessageItem]] = None
    ) -> Tuple[str, List[str], str]:
        """
        Returns: (reply_markdown, suggestions, model_used)
        """
        clean_prompt = prompt.strip()
        lower = clean_prompt.lower()
        model_name = f"Claude Sonnet (AWS Bedrock: {settings.BEDROCK_MODEL_ID})"

        # 1. Specialized Command: Summarization
        if any(w in lower for w in ["summarize", "catch up", "what happened", "tldr"]):
            overview, key_points, action_items, _ = SummarizerService.summarize(
                recent_messages or [], channel_name
            )
            reply = DiscordFormatter.format_summary_embed(overview, key_points, action_items, channel_name)
            return (reply, ["Draft follow up", "Create a poll", "Clear messages"], model_name)

        # 2. Specialized Command: Announcement
        if "announcement" in lower or "announce" in lower:
            topic = re.sub(r"^(create an announcement|announcement|announce)\s*:?", "", clean_prompt, flags=re.IGNORECASE).strip() or "Community Event"
            body = (
                f"We are hosting our community session today in **#{channel_name}**!\n"
                f"• **Live Group Voice:** Join General Voice with cameras & screen sharing enabled.\n"
                f"• **Topics:** Game night, updates, and open hangout."
            )
            reply = DiscordFormatter.format_announcement(f"📢 {topic.upper()}", body, channel_name)
            return (reply, ["Copy announcement", "Schedule another time", "Add voice link"], model_name)

        # 3. Specialized Command: Poll
        if "poll" in lower or "vote" in lower:
            topic = re.sub(r"^(create a poll|poll|vote)\s*:?", "", clean_prompt, flags=re.IGNORECASE).strip() or "Community Choice"
            options = ["Option A (Count me in! 🔥)", "Option B (Need a different time ⏱️)", "Option C (Suggest alternative 💡)"]
            reply = DiscordFormatter.format_poll(topic, options)
            return (reply, ["Create another poll", "Add 4th option", "Close poll"], model_name)

        # 4. AWS Bedrock LLM Generation for General Queries & Assistance
        llm = get_llm(temperature=0.3, max_tokens=1000)
        if llm:
            try:
                context_str = ""
                if recent_messages:
                    last_few = recent_messages[-8:]
                    context_str = "\n".join([f"{m.sender}: {m.content}" for m in last_few if m.content.strip()])

                system_prompt = f"""You are Clyde, the AI Assistant and smart bot for this Discord server.
Context:
- Current Channel: #{channel_name}
- Server Platform: Real-time Discord clone with WebRTC group voice/video calling, STOMP WebSockets, and Spring Boot + Next.js architecture.

Recent Channel Messages:
{context_str if context_str else "(No recent messages)"}

USER INQUIRY:
{clean_prompt}

Guidelines:
- Give a friendly, helpful, Discord-style response with clear markdown (bolding, lists, emojis).
- Keep it concise, engaging, and directly applicable.
- Do not hallucinate capabilities; encourage voice calls or community participation when relevant.
"""
                resp = llm.invoke(system_prompt)
                ai_text = (resp.content if isinstance(resp.content, str) else str(resp.content)).strip()
                if ai_text:
                    suggestions = ["/ai summarize", "/ai poll: Next Game", "/ai announce"]
                    return (ai_text, suggestions, model_name)
            except Exception as e:
                logger.warning(f"Bedrock invocation failed, using fallback copilot: {e}")

        # 5. Rule-based / Heuristic Fallback
        fallback_reply = (
            f"### 🤖 Clyde AI Assistant\n"
            f"You asked: *\"{clean_prompt}\"*\n\n"
            f"Here is what I recommend for #{channel_name}:\n"
            f"1. **Quick Coordination:** Use the **Group Call** button in the header toolbar to talk with members.\n"
            f"2. **Smart Inbox:** Open the **Inbox AI** tray in the top-right header for one-click channel digests.\n"
            f"3. **In-Chat Commands:** Type `/ai summarize` or `/ai poll [topic]` anytime right in chat!\n\n"
            f"Let me know if you'd like me to draft an announcement, write code, or summarize this thread! 🚀"
        )
        return (fallback_reply, ["/ai summarize", "/ai draft announcement", "/ai poll"], "Clyde Heuristic Copilot")
