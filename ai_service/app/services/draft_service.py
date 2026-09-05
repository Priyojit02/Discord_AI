from ..core.config import get_llm
from ..core.logger import logger

class DraftService:
    """Service enhancing and rewriting message drafts according to tone styles."""

    @classmethod
    def enhance_draft(cls, text: str, style: str = "discord") -> str:
        raw = text.strip()
        if not raw:
            return ""

        style_clean = style.lower()

        # 1. Attempt LLM generation via AWS Bedrock (Claude Sonnet)
        llm = get_llm(temperature=0.5, max_tokens=350)
        if llm:
            try:
                style_prompt_map = {
                    "discord": "in an enthusiastic, gamer/Discord community vibe with hype and emojis (e.g. 🚀, 🔥, 🎮)",
                    "professional": "in a clear, polite, collaborative workplace style suitable for professional teams",
                    "concise": "in a ultra-concise TL;DR format with zero fluff (1 sentence)",
                    "emojis": "surrounded by expressive Discord emojis without changing the underlying meaning",
                    "bullet_points": "as cleanly formatted markdown bullet points with bold keywords",
                }
                directive = style_prompt_map.get(style_clean, "in an engaging Discord style")

                prompt = f"""Rewrite the following draft message {directive}.
Do not add meta explanation, commentary, or quotes. Output ONLY the rewritten text:

ORIGINAL DRAFT:
{raw}
"""
                resp = llm.invoke(prompt)
                result = (resp.content if isinstance(resp.content, str) else str(resp.content)).strip()
                if result:
                    return result
            except Exception as e:
                logger.warning(f"Bedrock draft enhancement failed: {e}")

        # 2. Heuristic fallback
        return cls._heuristic_enhance(raw, style_clean)

    @staticmethod
    def _heuristic_enhance(raw: str, style: str) -> str:
        if style == "discord":
            return f"{raw} 🔥 🚀 Hop on voice when you see this!"
        elif style == "professional":
            return f"Hello team, regarding our discussion: {raw}. Please let me know if you have any feedback."
        elif style == "concise":
            first_sentence = raw.split(".")[0] or raw
            return first_sentence.strip() + "."
        elif style == "emojis":
            return f"✨ {raw} 🎮 💬 🔥"
        elif style == "bullet_points":
            lines = [line.strip() for line in raw.split("\n") if line.strip()]
            if len(lines) <= 1:
                lines = [p.strip() for p in raw.split(",") if p.strip()]
            return "\n".join(f"• {line}" for line in lines)
        return raw
