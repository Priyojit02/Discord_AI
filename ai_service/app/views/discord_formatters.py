from typing import List

class DiscordFormatter:
    """Provides Discord-flavored markdown formatting for AI outputs."""

    @staticmethod
    def format_announcement(title: str, body: str, channel: str = "announcements") -> str:
        return (
            f"📢 **SERVER ANNOUNCEMENT: #{channel}**\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"**{title}**\n\n"
            f"{body}\n\n"
            f"👉 React with 🔥 or 🎉 to acknowledge!\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        )

    @staticmethod
    def format_poll(topic: str, options: List[str]) -> str:
        emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"]
        lines = []
        for i, opt in enumerate(options[:5]):
            emo = emojis[i] if i < len(emojis) else f"{i+1}."
            lines.append(f"{emo} **{opt}**")

        opt_block = "\n".join(lines)
        return (
            f"📊 **Community Poll: {topic}**\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"{opt_block}\n\n"
            f"*Cast your vote by clicking or reacting with the matching emoji reaction below!*"
        )

    @staticmethod
    def format_summary_embed(overview: str, key_points: List[str], action_items: List[str], channel: str) -> str:
        kp_str = "\n".join(f"• {kp}" for kp in key_points) if key_points else "• Channel is quiet."
        act_str = "\n".join(f"🎯 {act}" for act in action_items) if action_items else "🎯 Keep collaborating!"
        return (
            f"### ⚡ Clyde AI Summary for #{channel}\n"
            f"{overview}\n\n"
            f"**Key Highlights:**\n"
            f"{kp_str}\n\n"
            f"**Action Items & Next Steps:**\n"
            f"{act_str}"
        )

    @staticmethod
    def format_bot_header(bot_name: str, topic: str) -> str:
        return f"### 🤖 {bot_name} • {topic}\n"
