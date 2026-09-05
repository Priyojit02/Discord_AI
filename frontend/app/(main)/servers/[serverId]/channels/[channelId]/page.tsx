'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Hash, Volume2, Bell, Pin, Users as UsersIcon, Search, HelpCircle, UserPlus, PhoneCall, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { useMessageStore, useServerStore, useModalStore, useVoiceStore, useAuthStore } from '@/store';
import { useChannelSocket } from '@/hooks/useWebSocket';
import ChatArea from '@/components/chat/ChatArea';
import ChatInput from '@/components/chat/ChatInput';
import MemberListSidebar from '@/components/layout/MemberListSidebar';
import VoiceChannelStage from '@/components/call/VoiceChannelStage';
import SmartInboxAssistant from '@/components/inbox/SmartInboxAssistant';
import { queryAIAssistant } from '@/lib/aiAssistant';

export default function ChannelPage({
  params,
}: {
  params: Promise<{ serverId: string; channelId: string }>;
}) {
  const { serverId, channelId } = use(params);
  const cId = Number(channelId);
  const sId = Number(serverId);
  const messageKey = `channel-${cId}`;

  const router = useRouter();
  const { messages, setMessages } = useMessageStore();
  const { setInviteModalOpen } = useModalStore();
  const { connectVoice } = useVoiceStore();
  const {
    activeServer,
    setActiveServer,
    servers,
    showMemberList,
    setShowMemberList,
    setActiveChannel,
    addChannelToServer,
  } = useServerStore();

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const handleStartGroupCall = async () => {
    let voiceChan = activeServer?.channels?.find((c) => c.type === 'VOICE');
    if (!voiceChan && activeServer) {
      try {
        const { data } = await api.post(`/servers/${activeServer.id}/channels`, {
          name: 'General Voice',
          type: 'VOICE',
        });
        addChannelToServer(activeServer.id, data);
        voiceChan = data;
      } catch (e) {
        console.error('Failed to create voice channel', e);
      }
    }

    if (voiceChan && activeServer) {
      setActiveChannel(voiceChan);
      connectVoice(voiceChan);
      router.push(`/servers/${activeServer.id}/channels/${voiceChan.id}`);
    }
  };

  const currentUser = useAuthStore((s) => s.user);

  // Socket listener with typing indicator (ignore self)
  useChannelSocket(cId, (username: string, typing: boolean) => {
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

  // Ensure active server and active channel are set
  useEffect(() => {
    if (!activeServer || activeServer.id !== sId) {
      const found = servers.find((s) => s.id === sId);
      if (found) {
        setActiveServer(found);
      } else {
        api.get(`/servers/${sId}`)
          .then(({ data }) => setActiveServer(data))
          .catch(() => {});
      }
    }
  }, [sId, activeServer, servers, setActiveServer]);

  const channel = activeServer?.channels?.find((c) => c.id === cId);

  useEffect(() => {
    if (channel) setActiveChannel(channel);
  }, [channel, setActiveChannel]);

  // Load message history
  useEffect(() => {
    if (cId) {
      api.get(`/channels/${cId}/messages`)
        .then(({ data }) => setMessages(messageKey, data))
        .catch(() => {});
    }
  }, [cId, messageKey, setMessages]);

  const [showInbox, setShowInbox] = useState(false);

  const channelName = channel?.name ?? 'channel';

  const handleSend = async (content: string, fileUrl?: string, fileName?: string) => {
    await api.post(`/channels/${cId}/messages`, { content, fileUrl, fileName });

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
              channelName,
              recentMessages: messages[messageKey] || [],
            });
            await api.post(`/channels/${cId}/messages`, {
              content: `🤖 **[Clyde AI Assistant]**\n\n${aiReply}`,
            });
          } catch (e) {
            console.error('Failed to get AI bot response', e);
          }
        }, 300);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 w-full bg-[#313338]">
      {/* 1. Header spans the entire top bar */}
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
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, marginRight: '16px' }}>
          {channel?.type === 'VOICE' ? (
            <Volume2 size={24} style={{ color: '#23a55a', flexShrink: 0 }} />
          ) : (
            <Hash size={24} style={{ color: '#80848e', flexShrink: 0 }} />
          )}
          <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {channelName}
          </span>
          {channel?.description && (
            <>
              <div style={{ width: '1px', height: '16px', backgroundColor: '#35373c', margin: '0 8px', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#949ba4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {channel.description}
              </span>
            </>
          )}
        </div>

        {/* Right Header Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b5bac1' }}>
          {/* Quick Invite Friends Button */}
          <button
            onClick={() => setInviteModalOpen(true)}
            style={{
              backgroundColor: 'rgba(88, 101, 242, 0.15)',
              border: 'none',
              borderRadius: '4px',
              color: '#5865f2',
              cursor: 'pointer',
              padding: '5px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5865f2';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(88, 101, 242, 0.15)';
              e.currentTarget.style.color = '#5865f2';
            }}
            title="Invite Friends to Server"
          >
            <UserPlus size={16} />
            <span className="hidden md:inline">Invite</span>
          </button>

          {/* Group Call Button */}
          {channel?.type !== 'VOICE' && (
            <button
              onClick={handleStartGroupCall}
              style={{
                backgroundColor: '#23a55a',
                border: 'none',
                borderRadius: '4px',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '5px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 8px rgba(35, 165, 90, 0.35)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a7e44')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#23a55a')}
              title="Start or Join Server Group Call"
            >
              <PhoneCall size={14} />
              <span>Group Call</span>
            </button>
          )}

          {/* Smart AI Inbox Assistant */}
          <button
            onClick={() => setShowInbox(!showInbox)}
            style={{
              backgroundColor: showInbox ? 'rgba(235, 69, 158, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: showInbox ? '#ffffff' : '#b5bac1',
              cursor: 'pointer',
              padding: '5px 8px',
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
            <Sparkles size={16} style={{ color: '#eb459e' }} />
            <span className="hidden lg:inline">Inbox AI</span>
          </button>

          <button
            style={{
              background: 'none',
              border: 'none',
              color: '#b5bac1',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#b5bac1')}
            title="Notification Settings"
          >
            <Bell size={18} />
          </button>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: '#b5bac1',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#b5bac1')}
            title="Pinned Messages"
          >
            <Pin size={18} />
          </button>
          <button
            onClick={() => setShowMemberList((prev) => !prev)}
            style={{
              border: 'none',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '4px',
              backgroundColor: showMemberList ? '#404249' : 'transparent',
              color: showMemberList ? '#ffffff' : '#80848e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="Toggle Member List"
          >
            <UsersIcon size={18} />
          </button>

          {/* Channel Search Input */}
          <div style={{ position: 'relative' }} className="hidden sm:block">
            <input
              style={{
                backgroundColor: '#1e1f22',
                color: '#ffffff',
                fontSize: '12px',
                padding: '6px 28px 6px 10px',
                borderRadius: '4px',
                outline: 'none',
                border: '1px solid transparent',
                transition: 'all 0.2s ease',
                width: '144px',
              }}
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => {
                e.target.style.width = '200px';
                e.target.style.borderColor = '#5865f2';
              }}
              onBlur={(e) => {
                e.target.style.width = '144px';
                e.target.style.borderColor = 'transparent';
              }}
            />
            <Search size={14} style={{ position: 'absolute', right: '8px', top: '8px', color: '#949ba4', pointerEvents: 'none' }} />
          </div>

          <button
            onClick={() => alert('Discord Help')}
            style={{
              background: 'none',
              border: 'none',
              color: '#b5bac1',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease',
            }}
            className="hidden sm:flex"
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#b5bac1')}
            title="Help"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </header>

      {/* 2. Body below Header */}
      {channel?.type === 'VOICE' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', minWidth: 0, width: '100%' }}>
          <VoiceChannelStage channel={channel} />
          <MemberListSidebar />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden', minWidth: 0, width: '100%' }}>
          {/* Left Chat Column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minWidth: 0, backgroundColor: '#313338' }}>
            <ChatArea
              messageKey={messageKey}
              messages={messages[messageKey] ?? []}
              title={channelName}
              description={channel?.description}
              isDM={false}
            />

            {/* Typing Indicator Bar */}
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
              placeholder={`Message #${channelName}`}
              onSend={handleSend}
              channelId={cId}
            />
          </div>

          {/* Right Member List Sidebar */}
          <MemberListSidebar />
        </div>
      )}

      {/* Smart Inbox Assistant Drawer */}
      <SmartInboxAssistant
        isOpen={showInbox}
        onClose={() => setShowInbox(false)}
        channelName={channelName}
        messages={messages[messageKey] || []}
        onSelectReply={(r) => handleSend(r)}
      />
    </div>
  );
}
