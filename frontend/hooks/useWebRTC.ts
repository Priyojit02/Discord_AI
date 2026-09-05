'use client';
import { useEffect, useRef } from 'react';
import { useCallStore } from '@/store/callStore';
import { useAuthStore } from '@/store';
import { getStompClient } from '@/lib/stomp';

export function useWebRTC() {
  const currentUser = useAuthStore((s) => s.user);
  const {
    callStatus,
    targetUser,
    localStream,
    setSpeaking,
    setRemoteSpeaking,
    receiveCall,
    acceptCall,
    endCall,
    setRemoteStream,
  } = useCallStore();

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const animFrame = useRef<number | null>(null);

  // Send signaling message via STOMP
  const sendSignal = (targetUserId: number, type: string, payload: any = {}) => {
    const client = getStompClient();
    if (!client || !client.connected) return;

    client.publish({
      destination: `/app/call/${targetUserId}/signal`,
      body: JSON.stringify({ type, ...payload }),
    });
  };

  // 1. WebSocket listener for incoming call signals
  useEffect(() => {
    const client = getStompClient();
    if (!client || !client.connected || !currentUser) return;

    const sub = client.subscribe('/user/queue/call/signal', async (message) => {
      try {
        const signal = JSON.parse(message.body);
        const { type, fromUserId, fromUsername, fromAvatarUrl, sdp, candidate, callType } = signal;

        switch (type) {
          case 'CALL_INVITE': {
            receiveCall(
              {
                id: fromUserId,
                username: fromUsername,
                displayName: fromUsername,
                avatarUrl: fromAvatarUrl,
                email: '',
                status: 'ONLINE',
                online: true,
              },
              callType || 'VOICE'
            );
            break;
          }

          case 'CALL_ACCEPT': {
            await acceptCall();
            break;
          }

          case 'CALL_REJECT':
          case 'CALL_END': {
            endCall();
            if (peerConnection.current) {
              peerConnection.current.close();
              peerConnection.current = null;
            }
            break;
          }

          case 'SDP_OFFER': {
            if (!peerConnection.current) createPeer();
            if (peerConnection.current) {
              await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
              const answer = await peerConnection.current.createAnswer();
              await peerConnection.current.setLocalDescription(answer);
              sendSignal(fromUserId, 'SDP_ANSWER', { sdp: answer });
            }
            break;
          }

          case 'SDP_ANSWER': {
            if (peerConnection.current) {
              await peerConnection.current.setRemoteDescription(new RTCSessionDescription(sdp));
            }
            break;
          }

          case 'ICE_CANDIDATE': {
            if (peerConnection.current && candidate) {
              try {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.error('Error adding ice candidate', e);
              }
            }
            break;
          }
        }
      } catch (err) {
        console.error('Error processing call signal', err);
      }
    });

    return () => {
      sub.unsubscribe();
    };
  }, [currentUser, receiveCall, acceptCall, endCall]);

  // Create WebRTC RTCPeerConnection
  const createPeer = () => {
    if (typeof window === 'undefined' || !window.RTCPeerConnection) return null;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && targetUser) {
        sendSignal(targetUser.id, 'ICE_CANDIDATE', { candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    peerConnection.current = pc;
    return pc;
  };

  // 2. Audio Analyser for Speaking Detection (Voice Activity Indicator)
  useEffect(() => {
    if (!localStream) {
      setSpeaking(false);
      return;
    }

    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack || !audioTrack.enabled) {
      setSpeaking(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(localStream);
      const node = ctx.createAnalyser();
      node.fftSize = 256;
      source.connect(node);

      audioContext.current = ctx;
      analyser.current = node;

      const dataArray = new Uint8Array(node.frequencyBinCount);

      const checkVolume = () => {
        if (!analyser.current) return;
        analyser.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        // Threshold for speaking detection
        const isCurrentlySpeaking = average > 14;
        setSpeaking(isCurrentlySpeaking);

        animFrame.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('AudioAnalyser could not initialize', err);
    }

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
      if (audioContext.current && audioContext.current.state !== 'closed') {
        audioContext.current.close().catch(() => {});
      }
    };
  }, [localStream, setSpeaking]);

  return {
    sendSignal,
    peerConnection: peerConnection.current,
  };
}
