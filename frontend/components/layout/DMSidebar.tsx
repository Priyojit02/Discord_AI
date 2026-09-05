'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Users, Plus, Bot, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { useDMStore } from '@/store';
import UserBottomBar from './UserBottomBar';

export default function DMSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { conversations, setConversations } = useDMStore();
  const [search, setSearch] = useState('');
  const [hoveredFriends, setHoveredFriends] = useState(false);
  const [hoveredConvId, setHoveredConvId] = useState<number | null>(null);

  useEffect(() => {
    api.get('/dm')
      .then(({ data }) => setConversations(data))
      .catch(() => {});
  }, [setConversations]);

  const isFriendsActive = pathname === '/dm';

  const statusColors: Record<string, string> = {
    ONLINE: '#23a55a',
    IDLE: '#f0b232',
    DND: '#da373c',
    OFFLINE: '#80848e',
  };

  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true;
    const name = c.otherUser?.displayName || c.otherUser?.username || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div
      style={{
        width: '240px',
        backgroundColor: '#2b2d31',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
        flexShrink: 0,
        borderRight: '1px solid #1e1f22',
      }}
    >
      {/* Search Header */}
      <div
        style={{
          height: '48px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #1e1f22',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
      >
        <input
          style={{
            width: '100%',
            backgroundColor: '#1e1f22',
            color: '#dbdee1',
            fontSize: '12px',
            padding: '6px 10px',
            borderRadius: '4px',
            outline: 'none',
            border: '1px solid transparent',
            transition: 'border-color 0.15s ease',
          }}
          placeholder="Find or start a conversation"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = '#5865f2')}
          onBlur={(e) => (e.target.style.borderColor = 'transparent')}
        />
      </div>

      {/* Navigation List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Friends Item */}
        <button
          onClick={() => router.push('/dm')}
          onMouseEnter={() => setHoveredFriends(true)}
          onMouseLeave={() => setHoveredFriends(false)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: isFriendsActive ? '#404249' : hoveredFriends ? '#35373c' : 'transparent',
            color: isFriendsActive || hoveredFriends ? '#ffffff' : '#949ba4',
            transition: 'all 0.15s ease',
          }}
        >
          <Users size={20} style={{ color: isFriendsActive ? '#ffffff' : '#80848e' }} />
          <span>Friends</span>
        </button>

        {/* Direct Messages Section */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              marginBottom: '4px',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#949ba4',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Direct Messages
            </span>
            <button
              onClick={() => router.push('/dm')}
              style={{
                background: 'none',
                border: 'none',
                color: '#949ba4',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#949ba4')}
              title="Create DM"
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredConversations.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#80848e', padding: '8px 12px', fontStyle: 'italic' }}>
                {search ? 'No conversations found' : 'No direct messages yet'}
              </p>
            ) : (
              filteredConversations.map((conv) => {
                const other = conv.otherUser;
                const isActive = pathname === `/dm/${other.id}`;
                const isHovered = hoveredConvId === conv.id;
                const statusDot = statusColors[other.status] || (other.online ? '#23a55a' : '#80848e');

                return (
                  <div
                    key={conv.id}
                    onClick={() => router.push(`/dm/${other.id}`)}
                    onMouseEnter={() => setHoveredConvId(conv.id)}
                    onMouseLeave={() => setHoveredConvId(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: isActive ? '#404249' : isHovered ? '#35373c' : 'transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#5865f2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 700,
                            overflow: 'hidden',
                          }}
                        >
                          {other.avatarUrl ? (
                            <img
                              src={other.avatarUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            (other.displayName || other.username).charAt(0).toUpperCase()
                          )}
                        </div>
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            border: '2px solid #2b2d31',
                            backgroundColor: statusDot,
                          }}
                        />
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: isActive || isHovered ? '#ffffff' : '#dbdee1',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.2,
                          }}
                        >
                          {other.displayName || other.username}
                        </p>
                        {conv.lastMessage?.content && (
                          <p
                            style={{
                              fontSize: '11px',
                              color: '#80848e',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginTop: '2px',
                              maxWidth: '140px',
                            }}
                          >
                            {conv.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* User Bottom Bar */}
      <UserBottomBar />
    </div>
  );
}
