'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, MessageSquare, Search, UserPlus, Share2, Check } from 'lucide-react';
import api from '@/lib/api';
import { useModalStore, useServerStore } from '@/store';
import { User } from '@/types';

type Tab = 'ONLINE' | 'ALL' | 'ADD_FRIEND';

export default function FriendsView() {
  const router = useRouter();
  const { setSelectedUserForCard, setInviteModalOpen } = useModalStore();
  const { activeServer } = useServerStore();

  const [activeTab, setActiveTab] = useState<Tab>('ONLINE');
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addFriendInput, setAddFriendInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitedMap, setInvitedMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setLoading(true);
    api.get('/users')
      .then(({ data }) => setUsers(data))
      .catch((e) => console.error('Failed to load users', e))
      .finally(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    ONLINE: '#23a55a',
    IDLE: '#f0b232',
    DND: '#da373c',
    OFFLINE: '#80848e',
  };

  const onlineUsers = users.filter((u) => u.online && u.status !== 'OFFLINE');
  const displayedUsers = (activeTab === 'ONLINE' ? onlineUsers : users).filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  const handleStartDM = (userId: number) => {
    router.push(`/dm/${userId}`);
  };

  const handleInviteFriendToServer = async (friend: User) => {
    if (!activeServer) return;
    try {
      setInvitedMap((prev) => ({ ...prev, [friend.id]: true }));
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const inviteLink = `${origin}/invite/${activeServer.inviteCode}`;
      await api.post(`/dm/${friend.id}/messages`, {
        content: `Hey! Join my server **${activeServer.name}**! 🚀\n${inviteLink}`,
      });
    } catch (e) {
      console.error('Failed to invite friend to server', e);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#313338',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Top Discord Friends Header */}
      <div
        style={{
          height: '48px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          borderBottom: '1px solid #1e1f22',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#949ba4', fontWeight: 600, fontSize: '14px' }}>
          <Users size={20} style={{ color: '#80848e' }} />
          <span style={{ color: '#ffffff' }}>Friends</span>
        </div>

        <div style={{ width: '1px', height: '20px', backgroundColor: '#35373c' }} />

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 500 }}>
          <button
            onClick={() => setActiveTab('ONLINE')}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'ONLINE' ? '#404249' : 'transparent',
              color: activeTab === 'ONLINE' ? '#ffffff' : '#b5bac1',
              transition: 'all 0.15s ease',
            }}
          >
            Online ({onlineUsers.length})
          </button>

          <button
            onClick={() => setActiveTab('ALL')}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'ALL' ? '#404249' : 'transparent',
              color: activeTab === 'ALL' ? '#ffffff' : '#b5bac1',
              transition: 'all 0.15s ease',
            }}
          >
            All ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('ADD_FRIEND')}
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: activeTab === 'ADD_FRIEND' ? 'transparent' : '#23a55a',
              color: activeTab === 'ADD_FRIEND' ? '#23a55a' : '#ffffff',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            <UserPlus size={16} />
            <span>Add Friend</span>
          </button>
        </div>

        {/* Quick Server Invite Banner if Active Server */}
        {activeServer && (
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => setInviteModalOpen(true)}
              style={{
                backgroundColor: 'rgba(88, 101, 242, 0.15)',
                color: '#5865f2',
                border: '1px solid rgba(88, 101, 242, 0.3)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
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
              title="Get Server Invite Link"
            >
              <Share2 size={14} />
              <span>Invite to {activeServer.name}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '880px' }}>
        {activeTab === 'ADD_FRIEND' ? (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Add Friend
            </h2>
            <p style={{ fontSize: '13px', color: '#949ba4', marginBottom: '16px' }}>
              You can search for people by their username and start direct messaging right away.
            </p>

            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <input
                style={{
                  width: '100%',
                  backgroundColor: '#1e1f22',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  outline: 'none',
                  border: '1px solid #1e1f22',
                  fontSize: '14px',
                  transition: 'border-color 0.15s ease',
                }}
                placeholder="Search username or display name..."
                value={addFriendInput}
                onChange={(e) => setAddFriendInput(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = '#5865f2')}
                onBlur={(e) => (e.target.style.borderColor = '#1e1f22')}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#949ba4', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Available People
              </h3>
              {users
                .filter((u) => {
                  if (!addFriendInput.trim()) return true;
                  const q = addFriendInput.toLowerCase();
                  return (
                    u.username.toLowerCase().includes(q) ||
                    (u.displayName && u.displayName.toLowerCase().includes(q))
                  );
                })
                .map((u) => (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#2b2d31',
                      border: '1px solid #1e1f22',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div
                      onClick={() => setSelectedUserForCard(u)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    >
                      <div style={{ position: 'relative' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#5865f2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '14px',
                            overflow: 'hidden',
                          }}
                        >
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            (u.displayName || u.username).charAt(0).toUpperCase()
                          )}
                        </div>
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            border: '2px solid #2b2d31',
                            backgroundColor: statusColors[u.status] || (u.online ? '#23a55a' : '#80848e'),
                          }}
                        />
                      </div>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', lineHeight: 1.2 }}>
                          {u.displayName || u.username}
                        </p>
                        <p style={{ fontSize: '12px', color: '#949ba4', marginTop: '2px' }}>@{u.username}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {activeServer && (
                        <button
                          onClick={() => handleInviteFriendToServer(u)}
                          disabled={invitedMap[u.id]}
                          style={{
                            backgroundColor: invitedMap[u.id] ? 'transparent' : 'rgba(88, 101, 242, 0.15)',
                            color: invitedMap[u.id] ? '#23a55a' : '#5865f2',
                            border: invitedMap[u.id] ? '1px solid #23a55a' : '1px solid rgba(88, 101, 242, 0.3)',
                            padding: '8px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: invitedMap[u.id] ? 'default' : 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {invitedMap[u.id] ? (
                            <>
                              <Check size={14} />
                              <span>Invited</span>
                            </>
                          ) : (
                            <>
                              <Share2 size={14} />
                              <span>Invite to Server</span>
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleStartDM(u.id)}
                        style={{
                          backgroundColor: '#5865f2',
                          color: '#ffffff',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                          boxShadow: '0 2px 8px rgba(88, 101, 242, 0.4)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4752c4')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#5865f2')}
                      >
                        <MessageSquare size={16} />
                        <span>Message</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div>
            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <input
                style={{
                  width: '100%',
                  backgroundColor: '#1e1f22',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '10px 16px 10px 40px',
                  outline: 'none',
                  border: '1px solid transparent',
                  fontSize: '14px',
                  transition: 'border-color 0.15s ease',
                }}
                placeholder="Search friends"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = '#5865f2')}
                onBlur={(e) => (e.target.style.borderColor = 'transparent')}
              />
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: '#80848e' }} />
            </div>

            {/* Friends Count Label */}
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#949ba4', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
              {activeTab === 'ONLINE' ? 'Online' : 'All Friends'} — {displayedUsers.length}
            </h3>

            {/* List */}
            {displayedUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                <div
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '50%',
                    backgroundColor: '#2b2d31',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    margin: '0 auto 16px auto',
                  }}
                >
                  🎮
                </div>
                <p style={{ fontSize: '16px', color: '#ffffff', fontWeight: 600, marginBottom: '4px' }}>
                  {searchQuery
                    ? 'No friends found matching your search.'
                    : activeTab === 'ONLINE'
                    ? 'No friends are online right now.'
                    : 'No friends found yet.'}
                </p>
                <p style={{ fontSize: '13px', color: '#949ba4' }}>
                  You can add people in the "Add Friend" tab to start chatting.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {displayedUsers.map((u) => {
                  const statusDot =
                    statusColors[u.status] || (u.online ? '#23a55a' : '#80848e');

                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        borderTop: '1px solid rgba(53, 55, 60, 0.4)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#35373c')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Left User Details */}
                      <div
                        onClick={() => setSelectedUserForCard(u)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1, minWidth: 0 }}
                      >
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: '#5865f2',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '14px',
                              overflow: 'hidden',
                            }}
                          >
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              (u.displayName || u.username).charAt(0).toUpperCase()
                            )}
                          </div>
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '-2px',
                              right: '-2px',
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              border: '2px solid #313338',
                              backgroundColor: statusDot,
                            }}
                          />
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.displayName || u.username}
                          </p>
                          <p style={{ fontSize: '12px', color: '#949ba4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                            @{u.username} ·{' '}
                            <span style={{ textTransform: 'capitalize' }}>
                              {u.status ? u.status.toLowerCase() : (u.online ? 'Online' : 'Offline')}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Right Quick Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {activeServer && (
                          <button
                            onClick={() => handleInviteFriendToServer(u)}
                            disabled={invitedMap[u.id]}
                            style={{
                              backgroundColor: invitedMap[u.id] ? 'transparent' : '#2b2d31',
                              color: invitedMap[u.id] ? '#23a55a' : '#b5bac1',
                              border: invitedMap[u.id] ? '1px solid #23a55a' : '1px solid #35373c',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: invitedMap[u.id] ? 'default' : 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title={`Invite to ${activeServer.name}`}
                          >
                            {invitedMap[u.id] ? (
                              <>
                                <Check size={13} />
                                <span>Invited</span>
                              </>
                            ) : (
                              <>
                                <Share2 size={13} />
                                <span>Invite to Server</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleStartDM(u.id)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: '#2b2d31',
                            color: '#b5bac1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#111214';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#2b2d31';
                            e.currentTarget.style.color = '#b5bac1';
                          }}
                          title="Message"
                        >
                          <MessageSquare size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
