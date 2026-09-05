'use client';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCallStore } from '@/store/callStore';
import { useWebRTC } from '@/hooks/useWebRTC';

export default function IncomingCallModal() {
  const { callStatus, isIncoming, targetUser, callType, acceptCall, rejectCall } = useCallStore();
  const { sendSignal } = useWebRTC();

  if (callStatus !== 'RINGING' || !isIncoming || !targetUser) return null;

  const handleAccept = async (video: boolean) => {
    if (targetUser) {
      sendSignal(targetUser.id, 'CALL_ACCEPT', { withVideo: video });
    }
    await acceptCall();
  };

  const handleDecline = () => {
    if (targetUser) {
      sendSignal(targetUser.id, 'CALL_REJECT');
    }
    rejectCall();
  };

  const displayName = targetUser.displayName || targetUser.username;

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 100,
        backgroundColor: '#1e1f22',
        border: '1px solid #3f4248',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        padding: '20px 24px',
        width: '360px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        animation: 'scaleIn 0.2s cubic-bezier(0.2, 0, 0, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              border: '2px solid #23a55a',
              animation: 'speakingPulse 1.5s infinite',
            }}
          />
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: '#5865f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '22px',
              fontWeight: 700,
              overflow: 'hidden',
            }}
          >
            {targetUser.avatarUrl ? (
              <img src={targetUser.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', lineHeight: 1.2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {displayName}
          </h4>
          <p style={{ fontSize: '12px', color: '#23a55a', fontWeight: 600, marginTop: '2px' }}>
            Incoming {callType === 'VIDEO' ? 'Video' : 'Voice'} Call...
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => handleAccept(false)}
          style={{
            flex: 1,
            backgroundColor: '#23a55a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(35, 165, 90, 0.4)',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = '#1f8b4d')}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = '#23a55a')}
        >
          <Phone size={16} />
          <span>Accept</span>
        </button>

        {callType === 'VIDEO' && (
          <button
            onClick={() => handleAccept(true)}
            style={{
              backgroundColor: '#5865f2',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(88, 101, 242, 0.4)',
            }}
            title="Accept with Video"
          >
            <Video size={16} />
          </button>
        )}

        <button
          onClick={handleDecline}
          style={{
            backgroundColor: '#da373c',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(218, 55, 60, 0.4)',
          }}
          title="Decline Call"
        >
          <PhoneOff size={16} />
          <span>Decline</span>
        </button>
      </div>
    </div>
  );
}
