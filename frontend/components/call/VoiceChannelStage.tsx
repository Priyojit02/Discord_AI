'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Headphones,
  PhoneOff,
  UserPlus,
  Radio,
  Volume2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Channel, User } from '@/types';
import { useRouter } from 'next/navigation';
import { useAuthStore, useVoiceStore, useModalStore, useServerStore } from '@/store';
import { sounds } from '@/store/callStore';
import { registerMediaStream, unregisterMediaStream, stopAllMediaStreams } from '@/lib/mediaManager';

interface Props {
  channel: Channel;
}

export default function VoiceChannelStage({ channel }: Props) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const { isMuted, isDeafened, toggleMute, toggleDeafen, disconnectVoice } = useVoiceStore();
  const { setInviteModalOpen } = useModalStore();
  const { activeServer } = useServerStore();

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  // Global unmount failsafe: Ensure all media tracks are stopped when leaving the voice stage
  useEffect(() => {
    return () => {
      stopAllMediaStreams();
    };
  }, []);

  // Initialize microphone audio detection for speaking glow ring (runs ONCE on mount)
  useEffect(() => {
    isCancelledRef.current = false;

    navigator.mediaDevices
      ?.getUserMedia({ audio: true })
      .then((s) => {
        if (isCancelledRef.current) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        micStreamRef.current = s;
        registerMediaStream(s);

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(s);
        source.connect(analyser);

        const buffer = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          if (!analyserRef.current || useVoiceStore.getState().isMuted) {
            setIsSpeaking(false);
          } else {
            analyserRef.current.getByteFrequencyData(buffer);
            const sum = buffer.reduce((acc, val) => acc + val, 0);
            const avg = sum / buffer.length;
            setIsSpeaking(avg > 18);
          }
          animFrameRef.current = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      })
      .catch((e) => {
        console.warn('Microphone access for speaking detector:', e);
      });

    return () => {
      isCancelledRef.current = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (micStreamRef.current) {
        unregisterMediaStream(micStreamRef.current);
        micStreamRef.current = null;
      }
    };
  }, []);

  // Handle hardware microphone track mute/unmute
  useEffect(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
    if (isMuted) setIsSpeaking(false);
  }, [isMuted]);

  // Toggle Camera
  const toggleCamera = async () => {
    if (isCameraOn) {
      if (localStream && !isScreenSharing) {
        unregisterMediaStream(localStream);
        setLocalStream(null);
      }
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: !isMuted });
        registerMediaStream(stream);
        setLocalStream(stream);
        setIsCameraOn(true);
        setIsScreenSharing(false);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error('Failed to open camera', err);
        alert('Could not access camera. Please verify camera permissions.');
      }
    }
  };

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (localStream) {
        unregisterMediaStream(localStream);
        setLocalStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        registerMediaStream(stream);
        setLocalStream(stream);
        setIsScreenSharing(true);
        setIsCameraOn(false);
        if (videoRef.current) videoRef.current.srcObject = stream;
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          unregisterMediaStream(stream);
          setLocalStream(null);
        };
      } catch (err) {
        console.error('Failed to share screen', err);
      }
    }
  };

  // Attach stream to video tag whenever stream changes
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, isCameraOn, isScreenSharing]);

  // Handle Disconnect from Voice Call
  const handleDisconnect = () => {
    // 1. Explicitly stop and unregister microphone stream
    if (micStreamRef.current) {
      unregisterMediaStream(micStreamRef.current);
      micStreamRef.current = null;
    }

    // 2. Stop and unregister local camera/screen tracks
    if (localStream) {
      unregisterMediaStream(localStream);
      setLocalStream(null);
    }
    setIsCameraOn(false);
    setIsScreenSharing(false);

    // 3. Stop microphone analyser and audio context
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // 4. Force-stop any active media streams globally
    stopAllMediaStreams();

    // 5. Clear store state
    disconnectVoice();

    // 6. Play disconnect sound
    try {
      sounds.playDisconnected();
    } catch {}

    // 7. Navigate away from voice stage back to text channel
    if (activeServer) {
      const textChan = activeServer.channels.find((c) => c.type === 'TEXT') || activeServer.channels[0];
      if (textChan) {
        useServerStore.getState().setActiveChannel(textChan);
        router.push(`/servers/${activeServer.id}/channels/${textChan.id}`);
      } else {
        router.push(`/servers/${activeServer.id}`);
      }
    }
  };

  // Connected participants list (Owner & currentUser and other members)
  const serverMembers: User[] = activeServer?.members || [];
  const otherMembers = serverMembers.filter((m) => m.id !== currentUser?.id).slice(0, 3);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#111214',
        backgroundImage: 'radial-gradient(ellipse at 50% 30%, #1e1f22 0%, #111214 85%)',
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 100 : 1,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Top Voice Header */}
      <div
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#23a55a',
              boxShadow: '0 0 10px #23a55a',
              animation: 'speakingPulse 1.5s infinite',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={18} style={{ color: '#23a55a' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.2px' }}>
                {channel.name}
              </h3>
            </div>
            <p style={{ fontSize: '11px', color: '#949ba4', marginTop: '1px' }}>
              Voice Channel Group Call — {1 + otherMembers.length} in channel
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setInviteModalOpen(true)}
            style={{
              backgroundColor: '#5865f2',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(88, 101, 242, 0.4)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4752c4')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#5865f2')}
            title="Invite Friends to Voice Call"
          >
            <UserPlus size={15} />
            <span>Invite Friends</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: '#b5bac1',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Call Stage - Video Tiles & Participants */}
      <div
        style={{
          flex: 1,
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: isCameraOn || isScreenSharing ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
        }}
      >
        {/* Local Video Camera or Screen Share Tile */}
        {(isCameraOn || isScreenSharing) && (
          <div
            style={{
              width: '100%',
              height: '100%',
              minHeight: '280px',
              backgroundColor: '#000000',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              border: isSpeaking ? '2px solid #23a55a' : '1px solid #2b2d31',
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: isScreenSharing ? 'contain' : 'cover',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                backgroundColor: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(4px)',
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>
                {currentUser?.displayName || currentUser?.username} (You)
              </span>
              {isScreenSharing && (
                <span style={{ fontSize: '10px', backgroundColor: '#5865f2', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>
                  Live Screen
                </span>
              )}
            </div>
          </div>
        )}

        {/* Current User Avatar Tile (if camera off) */}
        {!isCameraOn && !isScreenSharing && (
          <div
            style={{
              backgroundColor: '#2b2d31',
              borderRadius: '16px',
              padding: '28px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              border: isSpeaking ? '2px solid #23a55a' : '1px solid rgba(255,255,255,0.06)',
              transition: 'border 0.15s ease',
              minHeight: '200px',
            }}
          >
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#5865f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: 800,
                  overflow: 'hidden',
                  boxShadow: isSpeaking ? '0 0 20px rgba(35, 165, 90, 0.6)' : '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (currentUser?.displayName || currentUser?.username || 'U').charAt(0).toUpperCase()
                )}
              </div>
              {isSpeaking && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '-6px',
                    borderRadius: '50%',
                    border: '3px solid #23a55a',
                    animation: 'speakingPulse 1.5s infinite',
                  }}
                />
              )}
            </div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', textAlign: 'center' }}>
              {currentUser?.displayName || currentUser?.username}
            </p>
            <p style={{ fontSize: '11px', color: isSpeaking ? '#23a55a' : '#949ba4', marginTop: '2px', fontWeight: isSpeaking ? 600 : 400 }}>
              {isMuted ? 'Muted' : isSpeaking ? 'Speaking...' : 'Connected'}
            </p>
          </div>
        )}

        {/* Other Server Members in Voice Channel */}
        {otherMembers.map((m) => (
          <div
            key={m.id}
            style={{
              backgroundColor: '#2b2d31',
              borderRadius: '16px',
              padding: '28px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.06)',
              minHeight: '200px',
            }}
          >
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#5865f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: 800,
                  overflow: 'hidden',
                }}
              >
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (m.displayName || m.username).charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', textAlign: 'center' }}>
              {m.displayName || m.username}
            </p>
            <p style={{ fontSize: '11px', color: '#949ba4', marginTop: '2px' }}>
              Listening
            </p>
          </div>
        ))}

        {/* Big "Invite Friends" Tile to Easily Share Link */}
        <div
          onClick={() => setInviteModalOpen(true)}
          style={{
            backgroundColor: 'rgba(43, 45, 49, 0.4)',
            borderRadius: '16px',
            padding: '28px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #35373c',
            cursor: 'pointer',
            minHeight: '200px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(88, 101, 242, 0.1)';
            e.currentTarget.style.borderColor = '#5865f2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(43, 45, 49, 0.4)';
            e.currentTarget.style.borderColor = '#35373c';
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#5865f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              marginBottom: '12px',
              boxShadow: '0 4px 14px rgba(88, 101, 242, 0.4)',
            }}
          >
            <UserPlus size={28} />
          </div>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
            Invite Friends
          </p>
          <p style={{ fontSize: '11px', color: '#949ba4', marginTop: '2px', textAlign: 'center' }}>
            Share link or invite friends to join this voice call
          </p>
        </div>
      </div>

      {/* Floating Bottom In-Call Control Bar */}
      <div
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          backgroundColor: '#1e1f22',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          zIndex: 20,
        }}
      >
        {/* Toggle Camera */}
        <button
          onClick={toggleCamera}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: isCameraOn ? '#5865f2' : '#2b2d31',
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: isCameraOn ? '0 4px 12px rgba(88, 101, 242, 0.4)' : 'none',
          }}
          title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* Toggle Screen Share */}
        <button
          onClick={toggleScreenShare}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: isScreenSharing ? '#5865f2' : '#2b2d31',
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: isScreenSharing ? '0 4px 12px rgba(88, 101, 242, 0.4)' : 'none',
          }}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <Monitor size={20} />
        </button>

        {/* Toggle Mute */}
        <button
          onClick={toggleMute}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: isMuted ? '#da373c' : '#2b2d31',
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: isMuted ? '0 4px 12px rgba(218, 55, 60, 0.4)' : 'none',
          }}
          title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Toggle Deafen */}
        <button
          onClick={toggleDeafen}
          style={{
            width: '46px',
            height: '46px',
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
          title={isDeafened ? 'Undeafen' : 'Deafen Audio'}
        >
          <Headphones size={20} />
        </button>

        {/* Disconnect Voice */}
        <button
          onClick={handleDisconnect}
          style={{
            height: '46px',
            padding: '0 20px',
            borderRadius: '23px',
            backgroundColor: '#da373c',
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
            boxShadow: '0 4px 12px rgba(218, 55, 60, 0.4)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#a12828')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#da373c')}
          title="Disconnect from Voice Call"
        >
          <PhoneOff size={18} />
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );
}
