'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, LogOut, User as UserIcon, Shield, Volume2, Check } from 'lucide-react';
import api from '@/lib/api';
import { useModalStore, useAuthStore } from '@/store';
import { UserStatus } from '@/types';

export default function UserSettingsModal() {
  const router = useRouter();
  const { isUserSettingsOpen, setUserSettingsOpen } = useModalStore();
  const { user, setUser, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'voice'>('profile');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [status, setStatus] = useState<UserStatus>('ONLINE');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hoveredClose, setHoveredClose] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.username);
      setAvatarUrl(user.avatarUrl || '');
      setStatus((user.status as UserStatus) || 'ONLINE');
    }
  }, [user, isUserSettingsOpen]);

  const handleClose = () => {
    setUserSettingsOpen(false);
    if (typeof window !== 'undefined' && window.location.hash === '#settings') {
      window.history.back();
    }
  };

  // Synchronize modal state with URL hash (#settings) so browser Back cleanly closes settings
  useEffect(() => {
    if (!isUserSettingsOpen) return;

    if (window.location.hash !== '#settings') {
      window.location.hash = 'settings';
    }

    const handleHashChange = () => {
      if (window.location.hash !== '#settings') {
        setUserSettingsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserSettingsOpen, setUserSettingsOpen]);

  if (!isUserSettingsOpen || !user) return null;

  const hasChanges =
    displayName !== (user.displayName || user.username) ||
    avatarUrl !== (user.avatarUrl || '') ||
    status !== (user.status || 'ONLINE');

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const { data } = await api.patch('/users/me', {
        displayName: displayName.trim(),
        avatarUrl: avatarUrl.trim(),
        status,
      });
      setUser(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      console.error('Failed to update profile', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserSettingsOpen(false);
    if (typeof window !== 'undefined' && window.location.hash === '#settings') {
      window.history.replaceState(null, '', window.location.pathname);
    }
    router.replace('/login');
  };

  const statusColors: Record<string, string> = {
    ONLINE: '#23a55a',
    IDLE: '#f0b232',
    DND: '#da373c',
    OFFLINE: '#80848e',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        backgroundColor: '#313338',
        userSelect: 'none',
      }}
    >
      {/* Left Settings Navigation */}
      <div
        style={{
          width: '240px',
          backgroundColor: '#2b2d31',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          padding: '56px 24px 24px 12px',
          flexShrink: 0,
          borderRight: '1px solid #1e1f22',
        }}
      >
        <div style={{ width: '190px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={handleClose}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              marginBottom: '12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#dbdee1',
              backgroundColor: '#1e1f22',
              border: '1px solid #35373c',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#35373c';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1e1f22';
              e.currentTarget.style.color = '#dbdee1';
            }}
          >
            <span>← Back to Discord</span>
          </button>

          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#949ba4',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '0 8px',
              marginBottom: '4px',
            }}
          >
            User Settings
          </p>

          <button
            onClick={() => setActiveTab('profile')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '7px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'profile' ? '#404249' : 'transparent',
              color: activeTab === 'profile' ? '#ffffff' : '#b5bac1',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'profile') {
                e.currentTarget.style.backgroundColor = '#35373c';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'profile') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#b5bac1';
              }
            }}
          >
            <UserIcon size={18} />
            <span>My Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '7px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'account' ? '#404249' : 'transparent',
              color: activeTab === 'account' ? '#ffffff' : '#b5bac1',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'account') {
                e.currentTarget.style.backgroundColor = '#35373c';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'account') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#b5bac1';
              }
            }}
          >
            <Shield size={18} />
            <span>Account Security</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '7px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === 'voice' ? '#404249' : 'transparent',
              color: activeTab === 'voice' ? '#ffffff' : '#b5bac1',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'voice') {
                e.currentTarget.style.backgroundColor = '#35373c';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'voice') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#b5bac1';
              }
            }}
          >
            <Volume2 size={18} />
            <span>Voice & Video</span>
          </button>

          <div style={{ height: '1px', backgroundColor: '#35373c', margin: '8px 0' }} />

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '7px 12px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              color: '#da373c',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(218, 55, 60, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Right Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '56px 40px',
          overflowY: 'auto',
          maxWidth: '680px',
          position: 'relative',
        }}
      >
        {/* ESC Button */}
        <div style={{ position: 'absolute', top: '56px', right: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            onClick={handleClose}
            onMouseEnter={() => setHoveredClose(true)}
            onMouseLeave={() => setHoveredClose(false)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: hoveredClose ? '2px solid #ffffff' : '2px solid #80848e',
              color: hoveredClose ? '#ffffff' : '#80848e',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Close Settings (Esc)"
          >
            <X size={18} />
          </button>
          <span style={{ fontSize: '11px', color: '#80848e', fontWeight: 600, marginTop: '4px' }}>ESC</span>
        </div>

        {activeTab === 'profile' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '24px' }}>
              User Profile
            </h2>

            {/* Profile Card Preview */}
            <div
              style={{
                backgroundColor: '#1e1f22',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '24px',
                border: '1px solid #2b2d31',
              }}
            >
              <div style={{ height: '96px', background: 'linear-gradient(90deg, #5865f2 0%, #7983f5 100%)' }} />
              <div style={{ padding: '0 20px 20px 20px', position: 'relative' }}>
                <div style={{ position: 'relative', top: '-40px', marginBottom: '-30px', display: 'inline-block' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      border: '4px solid #1e1f22',
                      backgroundColor: '#5865f2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '28px',
                      fontWeight: 800,
                      overflow: 'hidden',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                    }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  {/* Status dot indicator */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: '4px solid #1e1f22',
                      backgroundColor: statusColors[status] || '#23a55a',
                    }}
                  />
                </div>

                <div style={{ marginTop: '8px' }}>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>{displayName}</p>
                  <p style={{ fontSize: '13px', color: '#949ba4', marginTop: '2px' }}>@{user.username}</p>
                </div>
              </div>
            </div>

            {/* Edit Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#b5bac1',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '8px',
                  }}
                >
                  Display Name
                </label>
                <input
                  style={{
                    width: '100%',
                    backgroundColor: '#1e1f22',
                    color: '#ffffff',
                    fontSize: '14px',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #35373c',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = '#5865f2')}
                  onBlur={(e) => (e.target.style.borderColor = '#35373c')}
                  maxLength={32}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#b5bac1',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '8px',
                  }}
                >
                  Avatar Image URL
                </label>
                <input
                  style={{
                    width: '100%',
                    backgroundColor: '#1e1f22',
                    color: '#ffffff',
                    fontSize: '14px',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #35373c',
                    outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  placeholder="https://example.com/avatar.png"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = '#5865f2')}
                  onBlur={(e) => (e.target.style.borderColor = '#35373c')}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#b5bac1',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '8px',
                  }}
                >
                  Online Status
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {[
                    { key: 'ONLINE', label: 'Online', desc: 'Active and available', color: '#23a55a' },
                    { key: 'IDLE', label: 'Idle', desc: 'Away from keyboard', color: '#f0b232' },
                    { key: 'DND', label: 'Do Not Disturb', desc: 'Mutes notifications', color: '#da373c' },
                    { key: 'OFFLINE', label: 'Invisible', desc: 'Appear offline to friends', color: '#80848e' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      onClick={() => setStatus(item.key as UserStatus)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: status === item.key ? '1px solid #5865f2' : '1px solid #35373c',
                        backgroundColor: status === item.key ? 'rgba(64, 66, 73, 0.6)' : '#2b2d31',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', lineHeight: 1.2 }}>{item.label}</p>
                        <p style={{ fontSize: '11px', color: '#949ba4', marginTop: '2px' }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '24px' }}>
              Account Information
            </h2>
            <div style={{ backgroundColor: '#2b2d31', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#949ba4', textTransform: 'uppercase' }}>Username</span>
                <p style={{ fontSize: '15px', color: '#ffffff', marginTop: '2px' }}>@{user.username}</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#949ba4', textTransform: 'uppercase' }}>Email</span>
                <p style={{ fontSize: '15px', color: '#ffffff', marginTop: '2px' }}>{user.email}</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#949ba4', textTransform: 'uppercase' }}>Account ID</span>
                <p style={{ fontSize: '12px', fontFamily: 'monospace', color: '#949ba4', marginTop: '2px' }}>#{user.id}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'voice' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '24px' }}>
              Voice Settings
            </h2>
            <div style={{ backgroundColor: '#2b2d31', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#949ba4', textTransform: 'uppercase' }}>Input Device</span>
                <p style={{ fontSize: '14px', color: '#ffffff', marginTop: '4px', backgroundColor: '#1e1f22', padding: '10px 12px', borderRadius: '6px', border: '1px solid #35373c' }}>
                  Default Microphone (Built-in)
                </p>
              </div>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#949ba4', textTransform: 'uppercase' }}>Output Device</span>
                <p style={{ fontSize: '14px', color: '#ffffff', marginTop: '4px', backgroundColor: '#1e1f22', padding: '10px 12px', borderRadius: '6px', border: '1px solid #35373c' }}>
                  Default Speakers (Built-in)
                </p>
              </div>
              <div style={{ paddingTop: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#949ba4', textTransform: 'uppercase' }}>Input Mode</span>
                <p style={{ fontSize: '14px', color: '#23a55a', fontWeight: 500, marginTop: '4px' }}>✓ Voice Activity (Enabled)</p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Save Changes Bar */}
        {hasChanges && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              maxWidth: '560px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#111214',
              color: '#ffffff',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              border: '1px solid #2b2d31',
              zIndex: 60,
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Careful — you have unsaved changes!</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={() => {
                  setDisplayName(user.displayName || user.username);
                  setAvatarUrl(user.avatarUrl || '');
                  setStatus((user.status as UserStatus) || 'ONLINE');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  textDecoration: 'underline',
                }}
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  backgroundColor: '#23a55a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {loading ? 'Saving...' : success ? <><Check size={14} /> Saved!</> : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
