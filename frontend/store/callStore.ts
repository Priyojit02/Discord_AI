'use client';
import { create } from 'zustand';
import { User } from '@/types';
import { registerMediaStream, stopAllMediaStreams } from '@/lib/mediaManager';

// Web Audio API Sound Synthesizer for authentic Discord call sound effects
class DiscordSoundEffects {
  private ctx: AudioContext | null = null;
  private ringInterval: any = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Discord Outgoing Ringtone (Two-tone melodic chirp)
  playOutgoingRing() {
    this.stopRing();
    const playChirp = () => {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    };

    playChirp();
    this.ringInterval = setInterval(playChirp, 2400);
  }

  // Discord Incoming Ringtone (Dual harmonic chime)
  playIncomingRing() {
    this.stopRing();
    const playRing = () => {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.09, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.4);
      });
    };

    playRing();
    this.ringInterval = setInterval(playRing, 2000);
  }

  stopRing() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  // Call Connected Chime (Ascending triad)
  playConnected() {
    this.stopRing();
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [440, 554.37, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0.1, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.3);
    });
  }

  // Call Disconnected Chime (Descending duo)
  playDisconnected() {
    this.stopRing();
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 440].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.09, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.35);
    });
  }
}

export const sounds = new DiscordSoundEffects();

export type CallType = 'VOICE' | 'VIDEO';
export type CallStatus = 'IDLE' | 'RINGING' | 'CONNECTED' | 'ENDED';

interface CallState {
  callType: CallType | null;
  callStatus: CallStatus;
  targetUser: User | null;
  isIncoming: boolean;

  localStream: MediaStream | null;
  remoteStream: MediaStream | null;

  isCameraOn: boolean;
  isMicMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  remoteSpeaking: boolean;

  isFullscreen: boolean;
  callDuration: number;

  // Actions
  startCall: (targetUser: User, type: CallType) => Promise<void>;
  receiveCall: (caller: User, type: CallType) => void;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;

  toggleCamera: () => Promise<void>;
  toggleMic: () => void;
  toggleScreenShare: () => Promise<void>;
  toggleDeafen: () => void;
  toggleFullscreen: () => void;

  setSpeaking: (speaking: boolean) => void;
  setRemoteSpeaking: (speaking: boolean) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  callType: null,
  callStatus: 'IDLE',
  targetUser: null,
  isIncoming: false,

  localStream: null,
  remoteStream: null,

  isCameraOn: false,
  isMicMuted: false,
  isDeafened: false,
  isScreenSharing: false,
  isSpeaking: false,
  remoteSpeaking: false,

  isFullscreen: false,
  callDuration: 0,

  startCall: async (targetUser: User, type: CallType) => {
    sounds.playOutgoingRing();
    set({
      callType: type,
      callStatus: 'RINGING',
      targetUser,
      isIncoming: false,
      isCameraOn: type === 'VIDEO',
      isMicMuted: false,
      isDeafened: false,
      callDuration: 0,
    });

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'VIDEO' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        registerMediaStream(stream);
        set({ localStream: stream });
      }
    } catch (err) {
      console.warn('Microphone/Webcam permission not granted, using simulated mode', err);
    }
  },

  receiveCall: (caller: User, type: CallType) => {
    sounds.playIncomingRing();
    set({
      callType: type,
      callStatus: 'RINGING',
      targetUser: caller,
      isIncoming: true,
      isCameraOn: type === 'VIDEO',
      isMicMuted: false,
      isDeafened: false,
    });
  },

  acceptCall: async () => {
    sounds.playConnected();
    const { callType } = get();

    let stream = get().localStream;
    if (!stream && navigator.mediaDevices?.getUserMedia) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'VIDEO' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        registerMediaStream(stream);
      } catch (err) {
        console.warn('Microphone/Webcam permission not granted on accept', err);
      }
    }

    set({
      callStatus: 'CONNECTED',
      isIncoming: false,
      localStream: stream,
      isCameraOn: callType === 'VIDEO',
    });
  },

  rejectCall: () => {
    sounds.playDisconnected();
    stopAllMediaStreams();
    set({
      callStatus: 'IDLE',
      callType: null,
      targetUser: null,
      isIncoming: false,
      localStream: null,
      remoteStream: null,
    });
  },

  endCall: () => {
    sounds.playDisconnected();
    stopAllMediaStreams();

    set({
      callStatus: 'IDLE',
      callType: null,
      targetUser: null,
      isIncoming: false,
      localStream: null,
      remoteStream: null,
      isCameraOn: false,
      isMicMuted: false,
      isScreenSharing: false,
      isDeafened: false,
      callDuration: 0,
      isSpeaking: false,
      remoteSpeaking: false,
      isFullscreen: false,
    });
  },

  toggleCamera: async () => {
    const { localStream, isCameraOn } = get();
    const newCameraState = !isCameraOn;

    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = newCameraState;
        set({ isCameraOn: newCameraState });
        return;
      }
    }

    if (newCameraState && navigator.mediaDevices?.getUserMedia) {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];
        if (localStream) {
          localStream.addTrack(videoTrack);
          set({ localStream, isCameraOn: true });
        } else {
          set({ localStream: videoStream, isCameraOn: true });
        }
      } catch (err) {
        console.warn('Camera permission denied', err);
      }
    } else {
      set({ isCameraOn: newCameraState });
    }
  },

  toggleMic: () => {
    const { localStream, isMicMuted } = get();
    const newMuted = !isMicMuted;
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => {
        t.enabled = !newMuted;
      });
    }
    set({ isMicMuted: newMuted });
  },

  toggleScreenShare: async () => {
    const { isScreenSharing, localStream } = get();
    if (isScreenSharing) {
      // Stop screen share
      if (localStream) {
        const screenTrack = localStream.getVideoTracks()[0];
        if (screenTrack) screenTrack.stop();
      }
      set({ isScreenSharing: false });
    } else {
      if (navigator.mediaDevices?.getDisplayMedia) {
        try {
          const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          const screenTrack = displayStream.getVideoTracks()[0];
          screenTrack.onended = () => {
            set({ isScreenSharing: false });
          };
          set({ localStream: displayStream, isScreenSharing: true });
        } catch (err) {
          console.warn('Screen share canceled/denied', err);
        }
      }
    }
  },

  toggleDeafen: () => {
    set((s) => ({ isDeafened: !s.isDeafened }));
  },

  toggleFullscreen: () => {
    set((s) => ({ isFullscreen: !s.isFullscreen }));
  },

  setSpeaking: (speaking: boolean) => set({ isSpeaking: speaking }),
  setRemoteSpeaking: (speaking: boolean) => set({ remoteSpeaking: speaking }),
  setRemoteStream: (stream: MediaStream | null) => set({ remoteStream: stream }),
}));
