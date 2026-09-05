'use client';
import { useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Headphones,
  PhoneOff,
  Maximize2,
  Minimize2,
  Volume2,
} from 'lucide-react';
import { useCallStore } from '@/store/callStore';
import { useAuthStore } from '@/store';
import { useWebRTC } from '@/hooks/useWebRTC';

export default function CallOverlay() {
  const currentUser = useAuthStore((s) => s.user);
  const {
    callType,
    callStatus,
    targetUser,
    isIncoming,
    localStream,
    remoteStream,
    isCameraOn,
    isMicMuted,
    isDeafened,
    isScreenSharing,
    isSpeaking,
    remoteSpeaking,
    isFullscreen,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
    toggleDeafen,
    toggleFullscreen,
    endCall,
    acceptCall,
  } = useCallStore();

  const { sendSignal } = useWebRTC();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCameraOn, isScreenSharing]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callStatus === 'IDLE' || !targetUser) return null;

  const handleHangup = () => {
    if (targetUser) {
      sendSignal(targetUser.id, 'CALL_END');
    }
    endCall();
  };

  const displayName = targetUser.displayName || targetUser.username;

  return (
    <div
      style={{
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 60 : 20,
        height: isFullscreen ? '100vh' : '360px',
        width: '100%',
        backgroundColor: '#111214',
        backgroundImage: 'radial-gradient(ellipse at 50% 40%, #1e1f22 0%, #111214 90%)',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: isFullscreen ? 0 : '12px',
        borderBottom: isFullscreen ? 'none' : '1px solid #1e1f22',
        boxShadow: isFullscreen ? 'none' : '0 10px 30px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        userSelect: 'none',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Top Bar inside Call */}
      <div
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: callStatus === 'CONNECTED' ? '#23a55a' : '#f0b232',
              boxShadow: callStatus === 'CONNECTED' ? '0 0 8px #23a55a' : '0 0 8px #f0b232',
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.2px' }}>
            {displayName}
          </span>
          <span style={{ fontSize: '11px', color: '#949ba4', marginLeft: '4px' }}>
            {callStatus === 'RINGING' ? (isIncoming ? 'Incoming call...' : 'Ringing...') : 'Voice Connected'}
          </span>
        </div>

        <button
          onClick={toggleFullscreen}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '6px',
            padding: '6px',
            color: '#b5bac1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Main Video / Participant Stage */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '16px',
          overflow: 'hidden',
        }}
      >
        {callStatus === 'RINGING' ? (
          /* Ringing Animation View */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            <div style={{ position: 'relative' }}>
              {/* Outer pulsing radar ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-20px',
                  borderRadius: '50%',
                  border: '2px solid rgba(88, 101, 242, 0.4)',
                  animation: 'speakingPulse 1.8s infinite',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: '-10px',
                  borderRadius: '50%',
                  border: '2px solid rgba(88, 101, 242, 0.7)',
                  animation: 'speakingPulse 1.8s infinite 0.4s',
                }}
              />
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  backgroundColor: '#5865f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '36px',
                  fontWeight: 700,
                  boxShadow: '0 8px 30px rgba(88, 101, 242, 0.5)',
                  overflow: 'hidden',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {targetUser.avatarUrl ? (
                  <img src={targetUser.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                {displayName}
              </h3>
              <p style={{ fontSize: '13px', color: '#949ba4' }}>
                {isIncoming ? 'Incoming Call...' : 'Ringing...'}
              </p>
            </div>
          </div>
        ) : (
          /* Connected State: Video Grid or Audio Cards */
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              position: 'relative',
            }}
          >
            {/* Remote Participant Tile */}
            <div
              style={{
                flex: 1,
                maxWidth: isFullscreen ? '90%' : '100%',
                height: '100%',
                maxHeight: '100%',
                backgroundColor: '#2b2d31',
                borderRadius: '12px',
                border: remoteSpeaking ? '2px solid #23a55a' : '1px solid #35373c',
                boxShadow: remoteSpeaking
                  ? '0 0 20px rgba(35, 165, 90, 0.4)'
                  : '0 4px 16px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Remote Video element if video stream exists */}
              {remoteStream && remoteStream.getVideoTracks().length > 0 ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                /* Avatar card fallback */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '50%',
                      backgroundColor: '#5865f2',
                      border: remoteSpeaking ? '3px solid #23a55a' : '3px solid transparent',
                      boxShadow: remoteSpeaking ? '0 0 0 6px rgba(35, 165, 90, 0.35)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '32px',
                      fontWeight: 700,
                      overflow: 'hidden',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {targetUser.avatarUrl ? (
                      <img src={targetUser.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
                    {displayName}
                  </span>
                </div>
              )}

              {/* Participant Name Badge (bottom-left) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(4px)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffffff',
                }}
              >
                <span>{displayName}</span>
              </div>
            </div>

            {/* Local Camera Tile (Picture-in-Picture at bottom right) */}
            {(isCameraOn || isScreenSharing || (!remoteStream && localStream)) && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '14px',
                  right: '14px',
                  width: isFullscreen ? '220px' : '150px',
                  height: isFullscreen ? '135px' : '95px',
                  backgroundColor: '#1e1f22',
                  borderRadius: '10px',
                  border: isSpeaking ? '2px solid #23a55a' : '1px solid #404249',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                  overflow: 'hidden',
                  zIndex: 20,
                  transition: 'all 0.15s ease',
                }}
              >
                {isCameraOn || isScreenSharing ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: isScreenSharing ? 'none' : 'scaleX(-1)', // mirror selfie camera
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#2b2d31',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#5865f2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 700,
                      }}
                    >
                      {currentUser?.displayName?.charAt(0).toUpperCase() || 'You'}
                    </div>
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '6px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  You {isMicMuted && '(Muted)'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Call Control Dock (classic Discord pill bar) */}
      <div
        style={{
          padding: '12px 20px 16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <div
          style={{
            backgroundColor: '#1e1f22',
            border: '1px solid #35373c',
            borderRadius: '16px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          }}
        >
          {/* Camera Toggle */}
          <button
            onClick={toggleCamera}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: isCameraOn ? '#5865f2' : '#2b2d31',
              color: isCameraOn ? '#ffffff' : '#b5bac1',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={toggleScreenShare}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: isScreenSharing ? '#23a55a' : '#2b2d31',
              color: isScreenSharing ? '#ffffff' : '#b5bac1',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Your Screen'}
          >
            <Monitor size={20} />
          </button>

          {/* Microphone Mute Toggle */}
          <button
            onClick={toggleMic}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: isMicMuted ? '#da373c' : '#2b2d31',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={isMicMuted ? 'Unmute' : 'Mute'}
          >
            {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Deafen Toggle */}
          <button
            onClick={toggleDeafen}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: isDeafened ? '#da373c' : '#2b2d31',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
          >
            <Headphones size={20} />
          </button>

          <div style={{ width: '1px', height: '24px', backgroundColor: '#35373c', margin: '0 2px' }} />

          {/* Red Disconnect Button */}
          <button
            onClick={handleHangup}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#da373c',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(218, 55, 60, 0.4)',
              transition: 'all 0.15s ease',
            }}
            title="Disconnect"
          >
            <PhoneOff size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
