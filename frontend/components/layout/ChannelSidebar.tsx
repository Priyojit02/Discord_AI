'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Hash,
  Volume2,
  Plus,
  ChevronDown,
  UserPlus,
  Trash2,
  LogOut,
  Radio,
  PhoneOff,
} from 'lucide-react';
import api from '@/lib/api';
import { useServerStore, useVoiceStore, useModalStore, useAuthStore } from '@/store';
import { sounds } from '@/store/callStore';
import { stopAllMediaStreams } from '@/lib/mediaManager';
import { Channel } from '@/types';
import UserBottomBar from './UserBottomBar';

export default function ChannelSidebar() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const {
    activeServer,
    activeChannel,
    setActiveChannel,
    removeServer,
    removeChannelFromServer,
  } = useServerStore();
  const { connectedChannel, connectVoice, disconnectVoice } = useVoiceStore();
  const { setCreateChannelOpen, setInviteModalOpen, openConfirmDialog } = useModalStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hoveredHeader, setHoveredHeader] = useState(false);
  const [hoveredChannelId, setHoveredChannelId] = useState<number | null>(null);

  if (!activeServer) return null;

  const isOwner = currentUser?.id === activeServer.owner?.id;

  const handleChannelClick = (channel: Channel) => {
    setActiveChannel(channel);
    if (channel.type === 'VOICE') {
      connectVoice(channel);
    }
    router.push(`/servers/${activeServer.id}/channels/${channel.id}`);
  };

  const handleDeleteChannel = (e: React.MouseEvent, channel: Channel) => {
    e.stopPropagation();
    openConfirmDialog({
      title: 'Delete Channel',
      description: 'Are you sure you want to delete',
      highlightText: `#${channel.name}`,
      confirmLabel: 'Delete Channel',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/servers/${activeServer.id}/channels/${channel.id}`);
          removeChannelFromServer(activeServer.id, channel.id);
          if (activeChannel?.id === channel.id) {
            const remaining = activeServer.channels.filter((c) => c.id !== channel.id);
            const next = remaining.find((c) => c.type === 'TEXT') || remaining[0];
            if (next) {
              setActiveChannel(next);
              router.push(`/servers/${activeServer.id}/channels/${next.id}`);
            }
          }
        } catch (err) {
          console.error('Failed to delete channel', err);
        }
      },
    });
  };

  const handleLeaveOrDelete = () => {
    setIsDropdownOpen(false);
    if (isOwner) {
      openConfirmDialog({
        title: `Delete '${activeServer.name}'`,
        description: `Are you sure you want to delete ${activeServer.name}? This action cannot be undone and will permanently delete all channels and messages.`,
        highlightText: activeServer.name,
        confirmLabel: 'Delete Server',
        confirmVariant: 'danger',
        onConfirm: async () => {
          try {
            await api.delete(`/servers/${activeServer.id}`);
            removeServer(activeServer.id);
            router.push('/dm');
          } catch (err) {
            console.error('Failed to delete server', err);
          }
        },
      });
    } else {
      openConfirmDialog({
        title: `Leave '${activeServer.name}'`,
        description: `Are you sure you want to leave ${activeServer.name}? You won't be able to rejoin unless you are re-invited.`,
        highlightText: activeServer.name,
        confirmLabel: 'Leave Server',
        confirmVariant: 'danger',
        onConfirm: async () => {
          try {
            await api.delete(`/servers/${activeServer.id}/leave`);
            removeServer(activeServer.id);
            router.push('/dm');
          } catch (err) {
            console.error('Failed to leave server', err);
          }
        },
      });
    }
  };

  const handleSidebarDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopAllMediaStreams();
    disconnectVoice();
    try {
      sounds.playDisconnected();
    } catch {}

    if (activeChannel?.type === 'VOICE' && activeServer) {
      const textChan = activeServer.channels.find((c) => c.type === 'TEXT') || activeServer.channels[0];
      if (textChan) {
        setActiveChannel(textChan);
        router.push(`/servers/${activeServer.id}/channels/${textChan.id}`);
      }
    }
  };

  const textChannels = (activeServer.channels || []).filter((c) => c.type === 'TEXT');
  const voiceChannels = (activeServer.channels || []).filter((c) => c.type === 'VOICE');

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
        position: 'relative',
        borderRight: '1px solid #1e1f22',
      }}
    >
      {/* Server Header Dropdown */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            height: '48px',
            width: '100%',
            padding: '0 12px 0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1e1f22',
            backgroundColor: isDropdownOpen || hoveredHeader ? '#35373c' : '#2b2d31',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            transition: 'background-color 0.15s ease',
          }}
        >
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            onMouseEnter={() => setHoveredHeader(true)}
            onMouseLeave={() => setHoveredHeader(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flex: 1,
              minWidth: 0,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              padding: 0,
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: '15px',
                color: '#ffffff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.2px',
              }}
            >
              {activeServer.name}
            </span>
            <ChevronDown
              size={18}
              style={{
                color: isDropdownOpen ? '#ffffff' : '#b5bac1',
                transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), color 0.15s ease',
                flexShrink: 0,
                marginLeft: '6px',
              }}
            />
          </button>

          {/* Direct Quick Invite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setInviteModalOpen(true);
            }}
            style={{
              backgroundColor: 'rgba(88, 101, 242, 0.15)',
              color: '#5865f2',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 7px',
              marginLeft: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              flexShrink: 0,
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
          </button>
        </div>

        {/* Server Dropdown Menu */}
        {isDropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: '52px',
              left: '8px',
              right: '8px',
              backgroundColor: '#111214',
              border: '1px solid #232428',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4)',
              padding: '6px',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                setInviteModalOpen(true);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#5865f2',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5865f2';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#5865f2';
              }}
            >
              <span>Invite People</span>
              <UserPlus size={16} />
            </button>

            <button
              onClick={() => {
                setIsDropdownOpen(false);
                setCreateChannelOpen(true);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#dbdee1',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5865f2';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#dbdee1';
              }}
            >
              <span>Create Channel</span>
              <Plus size={16} />
            </button>

            <div style={{ height: '1px', backgroundColor: '#232428', margin: '4px 0' }} />

            <button
              onClick={handleLeaveOrDelete}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#da373c',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#da373c';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#da373c';
              }}
            >
              <span>{isOwner ? 'Delete Server' : 'Leave Server'}</span>
              {isOwner ? <Trash2 size={16} /> : <LogOut size={16} />}
            </button>
          </div>
        )}
      </div>

      {/* Channels List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
        onClick={() => isDropdownOpen && setIsDropdownOpen(false)}
      >
        {/* Text Channels */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
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
              Text Channels
            </span>
            <button
              onClick={() => setCreateChannelOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#949ba4',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#949ba4')}
              title="Create Channel"
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
            {textChannels.map((channel) => {
              const isActive = activeChannel?.id === channel.id;
              const isHovered = hoveredChannelId === channel.id;

              return (
                <div
                  key={channel.id}
                  onClick={() => handleChannelClick(channel)}
                  onMouseEnter={() => setHoveredChannelId(channel.id)}
                  onMouseLeave={() => setHoveredChannelId(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: isActive ? '#404249' : isHovered ? '#35373c' : 'transparent',
                    color: isActive ? '#ffffff' : isHovered ? '#dbdee1' : '#949ba4',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <Hash
                      size={18}
                      style={{
                        flexShrink: 0,
                        color: isActive ? '#dbdee1' : '#80848e',
                      }}
                    />
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '14px',
                      }}
                    >
                      {channel.name}
                    </span>
                  </div>

                  {isOwner && (
                    <button
                      onClick={(e) => handleDeleteChannel(e, channel)}
                      style={{
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.15s ease, color 0.15s ease',
                        background: 'none',
                        border: 'none',
                        color: '#80848e',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#da373c')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#80848e')}
                      title="Delete Channel"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Voice Channels */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
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
              Voice Channels
            </span>
            <button
              onClick={() => setCreateChannelOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#949ba4',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#949ba4')}
              title="Create Channel"
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
            {voiceChannels.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#80848e', padding: '4px 8px', fontStyle: 'italic' }}>
                No voice channels yet
              </p>
            ) : (
              voiceChannels.map((channel) => {
                const isConnected = connectedChannel?.id === channel.id;
                const isHovered = hoveredChannelId === channel.id;

                return (
                  <div key={channel.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div
                      onClick={() => handleChannelClick(channel)}
                      onMouseEnter={() => setHoveredChannelId(channel.id)}
                      onMouseLeave={() => setHoveredChannelId(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        backgroundColor: isConnected
                          ? 'rgba(35, 165, 90, 0.15)'
                          : isHovered
                          ? '#35373c'
                          : 'transparent',
                        color: isConnected ? '#23a55a' : isHovered ? '#dbdee1' : '#949ba4',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          minWidth: 0,
                          overflow: 'hidden',
                        }}
                      >
                        <Volume2
                          size={18}
                          style={{
                            flexShrink: 0,
                            color: isConnected ? '#23a55a' : '#80848e',
                          }}
                        />
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: isConnected ? 600 : 500,
                            fontSize: '14px',
                          }}
                        >
                          {channel.name}
                        </span>
                      </div>

                      {isConnected && (
                        <Radio
                          size={14}
                          style={{
                            color: '#23a55a',
                            animation: 'speakingPulse 1.5s infinite',
                            flexShrink: 0,
                          }}
                        />
                      )}

                      {isOwner && (
                        <button
                          onClick={(e) => handleDeleteChannel(e, channel)}
                          style={{
                            opacity: isHovered ? 1 : 0,
                            transition: 'opacity 0.15s ease, color 0.15s ease',
                            background: 'none',
                            border: 'none',
                            color: '#80848e',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#da373c')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#80848e')}
                          title="Delete Channel"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Connected users list inside voice channel */}
                    {isConnected && (
                      <div style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
                        {currentUser && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(35, 165, 90, 0.12)',
                            }}
                          >
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: '#5865f2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                color: '#ffffff',
                                fontWeight: 700,
                                border: '1.5px solid #23a55a',
                                flexShrink: 0,
                              }}
                            >
                              {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span
                              style={{
                                fontSize: '12px',
                                color: '#ffffff',
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {currentUser.displayName || currentUser.username} (You)
                            </span>
                          </div>
                        )}

                        {(activeServer.members || [])
                          .filter((m) => m.id !== currentUser?.id)
                          .slice(0, 3)
                          .map((m) => (
                            <div
                              key={m.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '3px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              <div
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  backgroundColor: '#4752c4',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  color: '#ffffff',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {(m.displayName || m.username).charAt(0).toUpperCase()}
                              </div>
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: '#b5bac1',
                                  fontWeight: 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {m.displayName || m.username}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Voice Connected Bottom Status Panel */}
      {connectedChannel && (
        <div
          style={{
            backgroundColor: '#111214',
            borderTop: '1px solid #232428',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              onClick={() => {
                if (connectedChannel && activeServer) {
                  setActiveChannel(connectedChannel);
                  router.push(`/servers/${activeServer.id}/channels/${connectedChannel.id}`);
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, cursor: 'pointer' }}
              title="Click to view voice stage"
            >
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: '#23a55a',
                  boxShadow: '0 0 10px #23a55a',
                  animation: 'speakingPulse 1.5s infinite',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#23a55a', lineHeight: 1.2 }}>
                  Voice Connected
                </p>
                <p
                  style={{
                    fontSize: '11px',
                    color: '#949ba4',
                    marginTop: '2px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {connectedChannel.name}
                </p>
              </div>
            </div>
            <button
              onClick={handleSidebarDisconnect}
              style={{
                backgroundColor: 'rgba(218, 55, 60, 0.15)',
                color: '#da373c',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#da373c';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(218, 55, 60, 0.15)';
                e.currentTarget.style.color = '#da373c';
              }}
              title="Disconnect Voice"
            >
              <PhoneOff size={16} />
            </button>
          </div>
        </div>
      )}

      {/* User Profile Bar */}
      <UserBottomBar />
    </div>
  );
}
