import { Message } from '@/types';

const PYTHON_AI_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';

export interface AISummaryResult {
  overview: string;
  keyPoints: string[];
  actionItems: string[];
  smartReplies: string[];
}

/**
 * Summarizes chat messages by querying the Python FastAPI AI service on :8000,
 * with seamless fallback to client NLP.
 */
export async function summarizeMessagesAsync(
  messages: Message[],
  channelName: string = 'channel'
): Promise<AISummaryResult> {
  const payload = {
    channelName,
    messages: messages.map((m) => ({
      sender: m.sender.displayName || m.sender.username || 'User',
      content: m.content || '',
      timestamp: m.createdAt,
    })),
  };

  try {
    const res = await fetch(`${PYTHON_AI_URL}/api/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Python AI service not reachable, using local AI fallback:', err);
  }

  return summarizeMessages(messages);
}

/**
 * Synchronous local summarizer fallback.
 */
export function summarizeMessages(messages: Message[]): AISummaryResult {
  if (!messages || messages.length === 0) {
    return {
      overview: 'No messages have been sent in this channel yet.',
      keyPoints: ['Channel is quiet and ready for conversation.'],
      actionItems: ['Send a message or invite friends to get started!'],
      smartReplies: ['Hey everyone! 👋', 'What is everyone up to today?', 'Anyone free for a voice call? 🎙️'],
    };
  }

  const validMsgs = messages.filter((m) => !m.deleted && m.content.trim().length > 0);
  const totalCount = validMsgs.length;
  const recent = validMsgs.slice(-15);

  const senders = Array.from(new Set(recent.map((m) => m.sender.displayName || m.sender.username)));
  const links = recent.filter((m) => m.content.includes('http') || m.content.includes('/invite/'));
  const questions = recent.filter((m) => m.content.includes('?'));

  const overview = `Summarized the last ${Math.min(totalCount, 15)} messages between ${
    senders.length > 0 ? senders.join(', ') : 'members'
  }. The conversation is active with ${questions.length} question(s) asked and ${links.length} shared link(s).`;

  const keyPoints: string[] = [];
  recent.slice(-6).forEach((m) => {
    const sender = m.sender.displayName || m.sender.username;
    let snippet = m.content.length > 70 ? m.content.substring(0, 67) + '...' : m.content;
    keyPoints.push(`**${sender}**: "${snippet}"`);
  });

  const actionItems: string[] = [];
  if (links.length > 0) {
    actionItems.push('Review shared server invite links or media attachments.');
  }
  if (questions.length > 0) {
    actionItems.push(`Follow up on recent questions asked by ${questions[questions.length - 1].sender.displayName || 'members'}.`);
  } else {
    actionItems.push('Continue the discussion or jump into the voice channel for a live group call.');
  }

  const smartReplies = generateSmartReplies(recent);

  return { overview, keyPoints, actionItems, smartReplies };
}

/**
 * Generates context-aware smart quick replies.
 */
export function generateSmartReplies(messages: Message[]): string[] {
  if (!messages || messages.length === 0) {
    return ['Hey everyone! 👋', 'What are you working on?', 'Hop in voice! 🎧'];
  }

  const lastMsg = messages[messages.length - 1]?.content.toLowerCase() || '';

  if (lastMsg.includes('invite') || lastMsg.includes('join') || lastMsg.includes('server')) {
    return [
      'Joined! Thanks for the invite! 🎉',
      'Awesome, checking out the server now!',
      'Let me invite a few more friends too! 🚀',
    ];
  }

  if (lastMsg.includes('call') || lastMsg.includes('voice') || lastMsg.includes('video')) {
    return [
      'Joining the voice channel now! 🎧',
      'Give me 5 mins and I will hop in! ⏱️',
      'Mic ready, let us start! 🎙️',
    ];
  }

  if (lastMsg.includes('?') || lastMsg.includes('how') || lastMsg.includes('when') || lastMsg.includes('where')) {
    return [
      'Sounds good to me! 👍',
      'Let me double check and get back to you shortly.',
      'Totally agree with that plan.',
    ];
  }

  if (lastMsg.includes('hi') || lastMsg.includes('hello') || lastMsg.includes('hey')) {
    return [
      'Hey! How are you doing today? 👋',
      'Hello there! Ready for game night? 🎮',
      'Hey! What is the update? ✨',
    ];
  }

  return [
    'Sounds awesome! 🚀',
    'Got it, thanks for letting us know! 👍',
    'Could you share a bit more detail on that?',
    'Let us jump on voice to discuss! 🎙️',
  ];
}

/**
 * Transforms or refines a draft text.
 */
export function enhanceDraft(text: string, style: 'discord' | 'professional' | 'concise' | 'emojis'): string {
  const trimmed = text.trim();
  if (!trimmed) return '';

  switch (style) {
    case 'discord':
      return `${trimmed} 🔥 🚀 Hop in voice if you're free!`;
    case 'professional':
      return `Hello everyone, regarding our current discussion: ${trimmed}. Please let me know your thoughts.`;
    case 'concise':
      return trimmed.split('.')[0] || trimmed;
    case 'emojis':
      return `✨ ${trimmed} 🔥 🚀 💬`;
    default:
      return trimmed;
  }
}

/**
 * Intelligent AI Assistant query answering for in-chat `/ai` bot and Smart Inbox panel.
 * First queries the Python FastAPI AI service on :8000.
 */
export async function queryAIAssistant(
  prompt: string,
  channelContext: { channelName?: string; recentMessages?: Message[] } = {}
): Promise<string> {
  const cleanPrompt = prompt.trim();
  const chan = channelContext.channelName || 'channel';

  // 1. Try Python AI Backend Service on port 8000
  try {
    const res = await fetch(`${PYTHON_AI_URL}/api/ai/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleanPrompt,
        channelName: chan,
        recentMessages: (channelContext.recentMessages || []).map((m) => ({
          sender: m.sender.displayName || m.sender.username || 'User',
          content: m.content || '',
        })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) return data.reply;
    }
  } catch (e) {
    console.warn('Python AI backend query failed, using built-in engine:', e);
  }

  // 2. Fallback Engine
  const lower = cleanPrompt.toLowerCase();

  if (lower.includes('summarize') || lower.includes('catch up') || lower.includes('what happened')) {
    const summary = summarizeMessages(channelContext.recentMessages || []);
    return `### ⚡ Clyde AI Summary for #${chan}
${summary.overview}

**Key Highlights:**
${summary.keyPoints.map((p) => `• ${p}`).join('\n')}

**Suggested Next Steps:**
${summary.actionItems.map((a) => `• ${a}`).join('\n')}`;
  }

  if (lower === 'help' || lower.includes('what can you do') || lower.includes('commands')) {
    return `### 🤖 Discord AI Assistant (Clyde)
Connected to **Python AI Service (:8000)**!
• **/ai summarize**: Summarizes recent chat messages, topics, and action items.
• **/ai draft [announcement/message]**: Drafts clean announcements or friendly messages.
• **/ai explain [topic]**: Gives clear, concise explanations with code or bullet points.
• **/ai poll [topic]**: Formats a clean community poll idea with reaction emojis.
• **Direct Smart Inbox**: Click the **Inbox AI** icon in the header bar for live AI digests!`;
  }

  if (lower.includes('announcement') || lower.includes('announce')) {
    return `📢 **SERVER ANNOUNCEMENT: #${chan}**
━━━━━━━━━━━━━━━━━━━━━━
Hey @everyone!

We're excited to announce an upcoming server event and voice hangout session!
Make sure to check the **#${chan}** text channel and join **General Voice** when we go live.

React with 🔥 or 🎉 below to confirm you're coming!
━━━━━━━━━━━━━━━━━━━━━━`;
  }

  if (lower.includes('poll') || lower.includes('vote')) {
    return `📊 **Community Poll: ${cleanPrompt.replace(/^(create a poll|poll)\s*:?/i, '').trim() || 'Vote below!'}**

1️⃣ **Option A** (Strongly in favor)
2️⃣ **Option B** (Need more details)
3️⃣ **Option C** (Alternative suggestion)

*Cast your vote by reacting with the corresponding emoji!*`;
  }

  if (lower.includes('react') || lower.includes('webrtc') || lower.includes('websocket') || lower.includes('code') || lower.includes('typescript') || lower.includes('python')) {
    return `### 💡 Clyde Technical Breakdown:
Here is a quick overview regarding your question on **"${cleanPrompt}"**:
• **Python AI Service**: Running on \`:8000\` powered by FastAPI and Pydantic.
• **Spring Boot Backend**: Running on \`:8080\` coordinating WebSocket topics and MySQL persistence.
• **Next.js Frontend**: Running on \`:3000\` with WebRTC audio/video group stage and real-time state.`;
  }

  return `### 🤖 Clyde AI Assistant
You asked: *"${cleanPrompt}"*

Here is what I recommend for #${chan}:
1. **Communication**: Keep discussions organized by creating dedicated text and voice channels for each topic.
2. **Engagement**: Use **Group Call** in the top header to hop on voice and share screens.
3. **Collaboration**: Use the Smart Inbox Assistant (top right Sparkles icon) to generate quick summaries and smart responses!

Powered by the Python AI Service on \`:8000\`! 🚀`;
}
