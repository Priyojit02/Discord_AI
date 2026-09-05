'use client';
import { useState } from 'react';
import { Mic, MicOff, Headphones, Settings } from 'lucide-react';
import { useAuthStore, useVoiceStore, useModalStore } from '@/store';

export default function UserBottomBar() {
  const user = useAuthStore((s) => s.user);
  const { isMuted, isDeafened, toggleMute, toggleDeafen } = useVoiceStore();
  const { setUserSettingsOpen } = useModalStore();

  const [hoveredProfile, setHoveredProfile] = useState(false);
  const [hoveredMic, setHoveredMic] = useState(false);
  const [hoveredDeafen, setHoveredDeafen] = useState(false);
  const [hoveredSettings, setHoveredSettings] = useState(false);

  if (!user) return null;

  const statusColors: Record<string, string> = {
    ONLINE: '#23a55a',
    IDLE: '#f0b232',
    DND: '#da373c',
    OFFLINE: '#80848e',
  };

  const statusColor = statusColors[user.status] || '#23a55a';

  return (
    <div
      style={{
        height: '52px',
        backgroundColor: '#232428',
        padding: '0 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
        flexShrink: 0,
        borderTop: '1px solid #1e1f22',
      }}
    >
      {/* User Info (Click opens Settings) */}
      <button
        onClick={() => setUserSettingsOpen(true)}
        onMouseEnter={() => setHoveredProfile(true)}
        onMouseLeave={() => setHoveredProfile(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 6px',
          borderRadius: '4px',
          backgroundColor: hoveredProfile ? '#35373c' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          flex: 1,
          minWidth: 0,
          marginRight: '4px',
          textAlign: 'left',
          transition: 'background-color 0.15s ease',
        }}
        title="Open User Settings"
      >
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
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (user.displayName || user.username).charAt(0).toUpperCase()
            )}
          </div>
          {/* Status Dot */}
          <div
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              border: '2px solid #232428',
              backgroundColor: statusColor,
            }}
          />
        </div>

        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textDecoration: hoveredProfile ? 'underline' : 'none',
            }}
          >
            {user.displayName || user.username}
          </p>
          <p
            style={{
              fontSize: '11px',
              color: '#949ba4',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            @{user.username}
          </p>
        </div>
      </button>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
        {/* Mic Toggle */}
        <button
          onClick={toggleMute}
          onMouseEnter={() => setHoveredMic(true)}
          onMouseLeave={() => setHoveredMic(false)}
          style={{
            padding: '6px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: hoveredMic ? '#35373c' : 'transparent',
            color: isMuted ? '#da373c' : hoveredMic ? '#ffffff' : '#b5bac1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {/* Deafen Toggle */}
        <button
          onClick={toggleDeafen}
          onMouseEnter={() => setHoveredDeafen(true)}
          onMouseLeave={() => setHoveredDeafen(false)}
          style={{
            padding: '6px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: hoveredDeafen ? '#35373c' : 'transparent',
            color: isDeafened ? '#da373c' : hoveredDeafen ? '#ffffff' : '#b5bac1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          title={isDeafened ? 'Undeafen' : 'Deafen'}
        >
          <Headphones size={18} />
        </button>

        {/* User Settings */}
        <button
          onClick={() => setUserSettingsOpen(true)}
          onMouseEnter={() => setHoveredSettings(true)}
          onMouseLeave={() => setHoveredSettings(false)}
          style={{
            padding: '6px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: hoveredSettings ? '#35373c' : 'transparent',
            color: hoveredSettings ? '#ffffff' : '#b5bac1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          title="User Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}
