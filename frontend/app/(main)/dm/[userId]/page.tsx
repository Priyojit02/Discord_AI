'use client';
import { useEffect, useState, use } from 'react';
import { AtSign, Phone, Video, Pin, User as UserIcon, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { useMessageStore, useModalStore, useAuthStore } from '@/store';
import { useDMSocket } from '@/hooks/useWebSocket';
import { useCallStore } from '@/store/callStore';
import { useWebRTC } from '@/hooks/useWebRTC';
import { User } from '@/types';
import ChatArea from '@/components/chat/ChatArea';
import ChatInput from '@/components/chat/ChatInput';
import CallOverlay from '@/components/call/CallOverlay';
import SmartInboxAssistant from '@/components/inbox/SmartInboxAssistant';
import { queryAIAssistant } from '@/lib/aiAssistant';

export default function DMPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const uId = Number(userId);
  const messageKey = `dm-${uId}`;

  const currentUser = useAuthStore((s) => s.user);
  const { messages, setMessages } = useMessageStore();
  const { setSelectedUserForCard } = useModalStore();
  const { callStatus, targetUser, startCall } = useCallStore();
  const { sendSignal } = useWebRTC();

  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showInbox, setShowInbox] = useState(false);

  const isCallActiveWithThisUser = callStatus !== 'IDLE' && targetUser?.id === uId;

  const otherName = otherUser?.displayName || otherUser?.username || 'User';

  const handleStartVoiceCall = async () => {
    if (!otherUser) return;
    sendSignal(otherUser.id, 'CALL_INVITE', { callType: 'VOICE' });
    await startCall(otherUser, 'VOICE');
  };

  const handleStartVideoCall = async () => {
    if (!otherUser) return;
    sendSignal(otherUser.id, 'CALL_INVITE', { callType: 'VIDEO' });
    await startCall(otherUser, 'VIDEO');
  };

  // Real-time DM socket (ignore self)
  useDMSocket(uId, (username: string, typing: boolean) => {
    if (
      username === currentUser?.username ||
      username === currentUser?.displayName ||
      username === currentUser?.email
    ) {
      return;
    }
    setTypingUsers((prev) => {
      if (typing) {
        return prev.includes(username) ? prev : [...prev, username];
      } else {
        return prev.filter((u) => u !== username);
      }
    });
  });

  // Fetch other user profile
  useEffect(() => {
    api.get(`/users/${uId}`)
      .then(({ data }) => setOtherUser(data))
      .catch((e) => console.error('Failed to load user profile', e));
  }, [uId]);

  // Load message history between current user and target user
  useEffect(() => {
    api.get(`/dm/user/${uId}/messages`)
      .then(({ data }) => setMessages(messageKey, data))
      .catch((e) => console.error('Failed to load DM messages', e));
  }, [uId, messageKey, setMessages]);

  const handleSend = async (content: string, fileUrl?: string, fileName?: string) => {
    await api.post(`/dm/${uId}/messages`, { content, fileUrl, fileName });

    const isAIPrompt =
      content.startsWith('/ai') ||
      content.toLowerCase().startsWith('@ai') ||
      content.toLowerCase().startsWith('@clyde');

    if (isAIPrompt) {
      const prompt = content.replace(/^\/(?:ai|clyde)\s*|^@(?:ai|clyde)\s*/i, '').trim();
      if (prompt) {
        setTimeout(async () => {
          try {
            const aiReply = await queryAIAssistant(prompt, {
              channelName: otherName,
              recentMessages: messages[messageKey] || [],
            });
            await api.post(`/dm/${uId}/messages`, {
              content: `🤖 **[Clyde AI Assistant]**\n\n${aiReply}`,
            });
          } catch (e) {
            console.error('Failed to get AI bot response in DM', e);
          }
        }, 300);
      }
    }
  };

  const statusColors: Record<string, string> = {
    ONLINE: 'bg-[#23a55a]',
    IDLE: 'bg-[#f0b232]',
    DND: 'bg-[#da373c]',
    OFFLINE: 'bg-[#80848e]',
  };

  const statusDot = otherUser
    ? statusColors[otherUser.status] || (otherUser.online ? 'bg-[#23a55a]' : 'bg-[#80848e]')
    : 'bg-[#80848e]';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', userSelect: 'none', backgroundColor: '#313338' }}>
      {/* Header */}
      <header
        style={{
          height: '48px',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1e1f22',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          flexShrink: 0,
          userSelect: 'none',
          backgroundColor: '#313338',
          zIndex: 10,
        }}
      >
        <div
          onClick={() => otherUser && setSelectedUserForCard(otherUser)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          className="group"
        >
          <div style={{ position: 'relative' }}>
            <AtSign size={22} style={{ color: '#80848e' }} className="group-hover:text-white transition-colors" />
            <div
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                border: '2px solid #313338',
                backgroundColor: otherUser?.status === 'ONLINE' || otherUser?.online ? '#23a55a' : otherUser?.status === 'IDLE' ? '#f0b232' : otherUser?.status === 'DND' ? '#da373c' : '#80848e',
              }}
            />
          </div>
          <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '15px' }} className="group-hover:underline">
            {otherName}
          </span>
          <span style={{ fontSize: '12px', color: '#949ba4' }} className="hidden sm:inline">
            @{otherUser?.username}
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b5bac1' }}>
          <button
            onClick={handleStartVoiceCall}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: isCallActiveWithThisUser ? '#23a55a' : 'transparent',
              color: isCallActiveWithThisUser ? '#ffffff' : '#b5bac1',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (!isCallActiveWithThisUser) {
                e.currentTarget.style.backgroundColor = '#35373c';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCallActiveWithThisUser) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#b5bac1';
              }
            }}
            title="Start Voice Call"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={handleStartVideoCall}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: isCallActiveWithThisUser ? '#5865f2' : 'transparent',
              color: isCallActiveWithThisUser ? '#ffffff' : '#b5bac1',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (!isCallActiveWithThisUser) {
                e.currentTarget.style.backgroundColor = '#35373c';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isCallActiveWithThisUser) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#b5bac1';
              }
            }}
            title="Start Video Call"
          >
            <Video size={20} />
          </button>
          {/* Smart AI Inbox Assistant */}
          <button
            onClick={() => setShowInbox(!showInbox)}
            style={{
              backgroundColor: showInbox ? 'rgba(235, 69, 158, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: showInbox ? '#ffffff' : '#b5bac1',
              cursor: 'pointer',
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#404249';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = showInbox ? 'rgba(235, 69, 158, 0.2)' : 'transparent';
              e.currentTarget.style.color = showInbox ? '#ffffff' : '#b5bac1';
            }}
            title="Smart Inbox Assistant (AI Catch Up & Replies)"
          >
            <Sparkles size={18} style={{ color: '#eb459e' }} />
            <span className="hidden sm:inline">Inbox AI</span>
          </button>

          <button
            onClick={() => otherUser && setSelectedUserForCard(otherUser)}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#b5bac1',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#35373c';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#b5bac1';
            }}
            title="User Profile"
          >
            <UserIcon size={20} />
          </button>
        </div>
      </header>

      {/* Active Voice/Video Call Overlay */}
      {isCallActiveWithThisUser && <CallOverlay />}

      {/* Chat Messages */}
      <ChatArea
        messageKey={messageKey}
        messages={messages[messageKey] ?? []}
        title={otherName}
        isDM={true}
      />

      {/* Typing Indicator */}
      <div
        style={{
          height: '20px',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: '#dbdee1',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        {typingUsers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span className="typing-dot-1" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#dbdee1', display: 'inline-block' }} />
              <span className="typing-dot-2" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#dbdee1', display: 'inline-block' }} />
              <span className="typing-dot-3" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#dbdee1', display: 'inline-block' }} />
            </span>
            <span style={{ fontWeight: 500, color: '#b5bac1' }}>
              <strong style={{ color: '#ffffff' }}>{typingUsers.join(', ')}</strong>{' '}
              {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput
        placeholder={`Message @${otherName}`}
        onSend={handleSend}
        targetUserId={uId}
      />

      {/* Smart Inbox Assistant Drawer */}
      <SmartInboxAssistant
        isOpen={showInbox}
        onClose={() => setShowInbox(false)}
        channelName={otherName}
        messages={messages[messageKey] || []}
        onSelectReply={(r) => handleSend(r)}
      />
    </div>
  );
}
