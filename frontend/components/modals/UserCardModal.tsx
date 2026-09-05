'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, MessageSquare, Phone, Video, User as UserIcon, Settings } from 'lucide-react';
import { useModalStore, useAuthStore } from '@/store';
import { useCallStore } from '@/store/callStore';
import { useWebRTC } from '@/hooks/useWebRTC';
import { User } from '@/types';

export default function UserCardModal() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const { selectedUserForCard, setSelectedUserForCard, setUserSettingsOpen } = useModalStore();
  const { startCall } = useCallStore();
  const { sendSignal } = useWebRTC();

  const [hoveredClose, setHoveredClose] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState(false);
  const [hoveredVoice, setHoveredVoice] = useState(false);
  const [hoveredVideo, setHoveredVideo] = useState(false);

  if (!selectedUserForCard) return null;

  const u: User = selectedUserForCard;
  const isMe = currentUser?.id === u.id;

  const statusColors: Record<string, string> = {
    ONLINE: '#23a55a',
    IDLE: '#f0b232',
    DND: '#da373c',
    OFFLINE: '#80848e',
  };

  const statusDotColor = statusColors[u.status] || (u.online ? '#23a55a' : '#80848e');

  const handleStartDM = () => {
    setSelectedUserForCard(null);
    router.push(`/dm/${u.id}`);
  };

  const handleVoiceCall = async () => {
    setSelectedUserForCard(null);
    router.push(`/dm/${u.id}`);
    sendSignal(u.id, 'CALL_INVITE', { callType: 'VOICE' });
    await startCall(u, 'VOICE');
  };

  const handleVideoCall = async () => {
    setSelectedUserForCard(null);
    router.push(`/dm/${u.id}`);
    sendSignal(u.id, 'CALL_INVITE', { callType: 'VIDEO' });
    await startCall(u, 'VIDEO');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 70,
        userSelect: 'none',
      }}
      onClick={() => setSelectedUserForCard(null)}
    >
      <div
        style={{
          backgroundColor: '#232428',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)',
          border: '1px solid #35373c',
          width: '340px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div
          style={{
            height: '90px',
            background: 'linear-gradient(90deg, #5865f2 0%, #eb459e 100%)',
            position: 'relative',
          }}
        >
          <button
            onClick={() => setSelectedUserForCard(null)}
            onMouseEnter={() => setHoveredClose(true)}
            onMouseLeave={() => setHoveredClose(false)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: hoveredClose ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.4)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Avatar and Profile Header */}
        <div style={{ padding: '0 16px 16px 16px', position: 'relative' }}>
          <div style={{ position: 'relative', top: '-44px', marginBottom: '-32px', display: 'inline-block' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '4px solid #232428',
                backgroundColor: '#5865f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '30px',
                fontWeight: 800,
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
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
                bottom: '2px',
                right: '2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '3px solid #232428',
                backgroundColor: statusDotColor,
              }}
            />
          </div>

          <div
            style={{
              marginTop: '10px',
              backgroundColor: '#111214',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #2b2d31',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
              {u.displayName || u.username}
            </h3>
            <p style={{ fontSize: '12px', color: '#949ba4', marginTop: '2px' }}>@{u.username}</p>

            <div style={{ height: '1px', backgroundColor: '#232428', margin: '12px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#b5bac1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Status
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusDotColor }} />
                <span style={{ textTransform: 'capitalize' }}>
                  {u.status ? u.status.toLowerCase() : (u.online ? 'Online' : 'Offline')}
                </span>
              </div>
            </div>

            {/* Actions */}
            {!isMe ? (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={handleStartDM}
                  onMouseEnter={() => setHoveredMsg(true)}
                  onMouseLeave={() => setHoveredMsg(false)}
                  style={{
                    width: '100%',
                    backgroundColor: hoveredMsg ? '#4752c4' : '#5865f2',
                    color: '#ffffff',
                    padding: '9px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    boxShadow: '0 2px 8px rgba(88, 101, 242, 0.4)',
                  }}
                >
                  <MessageSquare size={16} />
                  <span>Go to Profile & Direct Message</span>
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleVoiceCall}
                    onMouseEnter={() => setHoveredVoice(true)}
                    onMouseLeave={() => setHoveredVoice(false)}
                    style={{
                      flex: 1,
                      backgroundColor: hoveredVoice ? '#1f8b4d' : '#23a55a',
                      color: '#ffffff',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <Phone size={14} />
                    <span>Voice Call</span>
                  </button>

                  <button
                    onClick={handleVideoCall}
                    onMouseEnter={() => setHoveredVideo(true)}
                    onMouseLeave={() => setHoveredVideo(false)}
                    style={{
                      flex: 1,
                      backgroundColor: hoveredVideo ? '#35373c' : '#2b2d31',
                      color: '#ffffff',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      border: '1px solid #35373c',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Video size={14} />
                    <span>Video Call</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '16px' }}>
                <button
                  onClick={() => {
                    setSelectedUserForCard(null);
                    setUserSettingsOpen(true);
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: '#35373c',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <Settings size={16} />
                  <span>Edit Profile</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
