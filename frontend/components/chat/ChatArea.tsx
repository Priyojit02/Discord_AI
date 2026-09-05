'use client';
import { useEffect, useRef } from 'react';
import { Hash, MessageSquare, UserPlus } from 'lucide-react';
import { Message } from '@/types';
import ChatMessage from './ChatMessage';
import { useMessageStore, useModalStore } from '@/store';

interface Props {
  messageKey: string;
  messages: Message[];
  title?: string;
  description?: string;
  isDM?: boolean;
}

export default function ChatArea({
  messageKey,
  messages,
  title = 'channel',
  description,
  isDM = false,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const updateMessage = useMessageStore((s) => s.updateMessage);
  const { setInviteModalOpen } = useModalStore();

  // Sort messages chronologically: oldest first
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '16px 16px 24px 16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Welcome Hero Banner */}
      <div
        style={{
          paddingTop: '32px',
          paddingBottom: '16px',
          paddingLeft: '8px',
          paddingRight: '8px',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            backgroundColor: '#35373c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            marginBottom: '12px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
          }}
        >
          {isDM ? <MessageSquare size={38} /> : <Hash size={38} />}
        </div>
        <h2
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.5px',
            marginBottom: '8px',
          }}
        >
          {isDM ? `This is the start of your conversation with ${title}` : `Welcome to #${title}!`}
        </h2>
        <p
          style={{
            color: '#949ba4',
            fontSize: '14px',
            maxWidth: '540px',
            lineHeight: 1.5,
          }}
        >
          {description ||
            (isDM
              ? `This is the beginning of your direct message history with ${title}. Send a message, share memories, or start a call!`
              : `This is the start of the #${title} channel. Say hello to everyone!`)}
        </p>

        {/* Server Invite Link Banner */}
        {!isDM && (
          <div
            style={{
              backgroundColor: 'rgba(88, 101, 242, 0.08)',
              border: '1px solid rgba(88, 101, 242, 0.25)',
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginTop: '18px',
              maxWidth: '540px',
            }}
          >
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                Invite your friends to this server!
              </p>
              <p style={{ fontSize: '12px', color: '#949ba4', marginTop: '3px' }}>
                Share your server link or invite your friends directly to get chatting.
              </p>
            </div>
            <button
              onClick={() => setInviteModalOpen(true)}
              style={{
                backgroundColor: '#5865f2',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(88, 101, 242, 0.4)',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4752c4')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#5865f2')}
              title="Get Server Invite Link"
            >
              <UserPlus size={15} />
              <span>Invite Friends</span>
            </button>
          </div>
        )}

        <div style={{ height: '1px', backgroundColor: '#35373c', marginTop: '24px' }} />
      </div>

      {/* Messages Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {sortedMessages.map((msg, index) => {
          const prevMsg = sortedMessages[index - 1];
          const isConsecutive =
            prevMsg &&
            prevMsg.sender.id === msg.sender.id &&
            new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() <
              5 * 60 * 1000;

          return (
            <ChatMessage
              key={msg.id}
              message={msg}
              messageKey={messageKey}
              isConsecutive={isConsecutive}
              onUpdate={(updated) => updateMessage(messageKey, updated)}
            />
          );
        })}
      </div>
    </div>
  );
}
