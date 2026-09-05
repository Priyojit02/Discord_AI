'use client';
import { useState, useEffect } from 'react';
import { X, Check, Copy, Link as LinkIcon, Send, Search, Users } from 'lucide-react';
import { useModalStore, useServerStore } from '@/store';
import { User } from '@/types';
import api from '@/lib/api';

export default function InviteModal() {
  const { isInviteModalOpen, setInviteModalOpen } = useModalStore();
  const { activeServer } = useServerStore();
  const [copied, setCopied] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [invitedMap, setInvitedMap] = useState<Record<number, boolean>>({});
  const [loadingFriends, setLoadingFriends] = useState(false);

  useEffect(() => {
    if (isInviteModalOpen) {
      setLoadingFriends(true);
      api.get('/users')
        .then(({ data }) => setFriends(data || []))
        .catch(() => {})
        .finally(() => setLoadingFriends(false));
    }
  }, [isInviteModalOpen]);

  if (!isInviteModalOpen || !activeServer) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const inviteCode = activeServer.inviteCode;
  const inviteLink = `${origin}/invite/${inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDirectInvite = async (friend: User) => {
    try {
      setInvitedMap((prev) => ({ ...prev, [friend.id]: true }));
      await api.post(`/dm/${friend.id}/messages`, {
        content: `Hey! Join my server **${activeServer.name}**! 🚀\n${inviteLink}`,
      });
    } catch (e) {
      console.error('Failed to send invite', e);
    }
  };

  const filteredFriends = friends.filter((f) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (f.displayName && f.displayName.toLowerCase().includes(q)) ||
      (f.username && f.username.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="modal-overlay"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 60,
      }}
      onClick={() => setInviteModalOpen(false)}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: '#313338',
          border: '1px solid #3f4248',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
          maxWidth: '480px',
          borderRadius: '14px',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px 24px',
            position: 'relative',
            borderBottom: '1px solid #232428',
            background: 'linear-gradient(180deg, #2b2d31 0%, #313338 100%)',
          }}
        >
          <button
            onClick={() => setInviteModalOpen(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: '#1e1f22',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#949ba4',
            }}
            title="Close"
          >
            <X size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#5865f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              {activeServer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                Invite friends to {activeServer.name}
              </h2>
              <p style={{ fontSize: '12px', color: '#949ba4', marginTop: '2px' }}>
                Share this link or invite your friends directly
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Shareable Invite Link Section */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#b5bac1',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px',
              }}
            >
              <LinkIcon size={13} style={{ color: '#5865f2' }} />
              Shareable Server Invite Link
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#1e1f22',
                borderRadius: '8px',
                padding: '4px',
                border: '1px solid #35373c',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
              }}
            >
              <input
                readOnly
                value={inviteLink}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#dbdee1',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  padding: '8px 12px',
                  userSelect: 'all',
                }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopy}
                style={{
                  backgroundColor: copied ? '#23a55a' : '#5865f2',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: copied
                    ? '0 0 12px rgba(35, 165, 90, 0.4)'
                    : '0 2px 8px rgba(88, 101, 242, 0.35)',
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#23a55a', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>✓</span> Your invite link is active and will never expire
            </p>
          </div>

          {/* Direct Invite Friends Section */}
          <div style={{ borderTop: '1px solid #35373c', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#b5bac1',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <Users size={13} style={{ color: '#5865f2' }} />
                Invite Friends Directly
              </label>
            </div>

            {/* Friend search */}
            <div
              style={{
                position: 'relative',
                marginBottom: '10px',
              }}
            >
              <input
                placeholder="Search for a friend..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#1e1f22',
                  border: '1px solid #35373c',
                  borderRadius: '6px',
                  padding: '7px 10px 7px 30px',
                  fontSize: '12px',
                  color: '#dbdee1',
                  outline: 'none',
                }}
              />
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '9px', color: '#80848e' }}
              />
            </div>

            {/* Friends list */}
            <div
              style={{
                maxHeight: '170px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                paddingRight: '4px',
              }}
            >
              {loadingFriends ? (
                <p style={{ fontSize: '12px', color: '#80848e', padding: '12px', textAlign: 'center' }}>
                  Loading friends...
                </p>
              ) : filteredFriends.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#80848e', padding: '12px', textAlign: 'center' }}>
                  {search ? 'No friends found matching your search' : 'No friends available to invite'}
                </p>
              ) : (
                filteredFriends.map((f) => {
                  const isInvited = !!invitedMap[f.id];
                  return (
                    <div
                      key={f.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: '#2b2d31',
                        border: '1px solid #35373c',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#5865f2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '11px',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {f.avatarUrl ? (
                            <img src={f.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            (f.displayName || f.username).charAt(0).toUpperCase()
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', lineHeight: 1.2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {f.displayName || f.username}
                          </p>
                          <p style={{ fontSize: '11px', color: '#949ba4', lineHeight: 1 }}>
                            @{f.username}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDirectInvite(f)}
                        disabled={isInvited}
                        style={{
                          backgroundColor: isInvited ? 'transparent' : '#5865f2',
                          color: isInvited ? '#23a55a' : '#ffffff',
                          border: isInvited ? '1px solid #23a55a' : 'none',
                          borderRadius: '4px',
                          padding: '5px 12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: isInvited ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                        }}
                      >
                        {isInvited ? (
                          <>
                            <Check size={13} />
                            <span>Sent</span>
                          </>
                        ) : (
                          <>
                            <Send size={12} />
                            <span>Invite</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div
          style={{
            backgroundColor: '#2b2d31',
            padding: '12px 24px',
            borderTop: '1px solid #232428',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '11px', color: '#80848e' }}>
            Invite Code: <strong style={{ color: '#dbdee1', fontFamily: 'monospace' }}>{inviteCode}</strong>
          </span>
          <button
            onClick={() => setInviteModalOpen(false)}
            style={{
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
