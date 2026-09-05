from typing import List, Tuple
from ..models.message import MessageItem
from ..models.insights import SentimentMetric

class SentimentService:
    """Service analyzing sentiment, energy, and engagement trends for a channel."""

    POSITIVE_WORDS = {"great", "awesome", "good", "love", "cool", "nice", "fire", "superb", "yes", "hype", "gg", "fun", "let's go"}
    NEGATIVE_WORDS = {"bad", "terrible", "issue", "bug", "broken", "hate", "slow", "error", "fail", "no", "crash"}

    @classmethod
    def analyze_channel(cls, messages: List[MessageItem], channel_name: str = "general") -> Tuple[SentimentMetric, str]:
        valid_msgs = [m for m in messages if m.content and m.content.strip()]
        if not valid_msgs:
            metric = SentimentMetric(
                score=0.0,
                sentiment="Quiet & Calm",
                energy="Low",
                activeSpeakers=0,
                topics=["Channel newly created or inactive"],
            )
            return (metric, f"#{channel_name} currently has no chat activity.")

        speakers = list(dict.fromkeys(m.sender for m in valid_msgs))
        text = " ".join(m.content.lower() for m in valid_msgs)
        words = text.split()

        pos_count = sum(1 for w in words if w in cls.POSITIVE_WORDS)
        neg_count = sum(1 for w in words if w in cls.NEGATIVE_WORDS)
        total_signal = pos_count + neg_count

        if total_signal == 0:
            score = 0.2  # Slightly positive baseline for casual chat
        else:
            score = round((pos_count - neg_count) / max(total_signal, 1), 2)

        if score > 0.3:
            sentiment = "Enthusiastic & Positive 🔥"
            energy = "High"
        elif score < -0.2:
            sentiment = "Critical / Troubleshooting ⚠️"
            energy = "Moderate"
        else:
            sentiment = "Friendly & Collaborative 💬"
            energy = "Moderate"

        topics = []
        if any("voice" in m.content.lower() or "call" in m.content.lower() for m in valid_msgs):
            topics.append("Voice & Calling Hangouts")
        if any("game" in m.content.lower() or "play" in m.content.lower() for m in valid_msgs):
            topics.append("Gaming & Sessions")
        if any("code" in m.content.lower() or "bug" in m.content.lower() for m in valid_msgs):
            topics.append("Development & Engineering")
        if not topics:
            topics.append("General Community Chat")

        metric = SentimentMetric(
            score=score,
            sentiment=sentiment,
            energy=energy,
            activeSpeakers=len(speakers),
            topics=topics,
        )

        summary = (
            f"Channel #{channel_name} vibe is **{sentiment}** with **{energy}** energy across "
            f"{len(speakers)} participant(s). Focus topics include {', '.join(topics)}."
        )

        return (metric, summary)
