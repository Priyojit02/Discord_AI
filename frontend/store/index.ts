import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Server, Channel, Message, Reaction, DirectMessageConversation } from '@/types';
import api from '@/lib/api';
import { stopAllMediaStreams } from '@/lib/mediaManager';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

interface ServerState {
  servers: Server[];
  activeServer: Server | null;
  activeChannel: Channel | null;
  showMemberList: boolean;
  setShowMemberList: (show: boolean | ((prev: boolean) => boolean)) => void;
  setServers: (servers: Server[]) => void;
  setActiveServer: (server: Server | null) => void;
  setActiveChannel: (channel: Channel | null) => void;
  addServer: (server: Server) => void;
  updateServer: (server: Server) => void;
  removeServer: (serverId: number) => void;
  addChannelToServer: (serverId: number, channel: Channel) => void;
  removeChannelFromServer: (serverId: number, channelId: number) => void;
}

interface MessageState {
  messages: Record<string, Message[]>;
  addMessage: (key: string, message: Message) => void;
  setMessages: (key: string, messages: Message[]) => void;
  updateMessage: (key: string, message: Message) => void;
  deleteMessage: (key: string, messageId: number) => void;
  updateMessageReactions: (key: string, messageId: number, reactions: Reaction[]) => void;
}

interface VoiceState {
  connectedChannel: Channel | null;
  isMuted: boolean;
  isDeafened: boolean;
  connectVoice: (channel: Channel) => void;
  disconnectVoice: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
}

export interface ConfirmDialogOptions {
  title: string;
  description: string;
  highlightText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void | Promise<void>;
}

interface ModalState {
  isCreateServerOpen: boolean;
  setCreateServerOpen: (open: boolean) => void;
  isJoinServerOpen: boolean;
  setJoinServerOpen: (open: boolean) => void;
  isCreateChannelOpen: boolean;
  setCreateChannelOpen: (open: boolean) => void;
  isUserSettingsOpen: boolean;
  setUserSettingsOpen: (open: boolean) => void;
  isInviteModalOpen: boolean;
  setInviteModalOpen: (open: boolean) => void;
  selectedUserForCard: User | null;
  setSelectedUserForCard: (user: User | null) => void;
  confirmDialog: ConfirmDialogOptions | null;
  openConfirmDialog: (options: ConfirmDialogOptions) => void;
  closeConfirmDialog: () => void;
}

interface DMState {
  conversations: DirectMessageConversation[];
  setConversations: (conversations: DirectMessageConversation[]) => void;
  activeDMUser: User | null;
  setActiveDMUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
      user: null,
      setAuth: (token, user) => {
        if (typeof window !== 'undefined') localStorage.setItem('token', token);
        set({ token, user });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        if (typeof window !== 'undefined') localStorage.removeItem('token');
        try {
          stopAllMediaStreams();
        } catch {}
        set({ token: null, user: null });
      },
      fetchMe: async () => {
        try {
          const { data } = await api.get('/users/me');
          set({ user: data });
        } catch {
          // Token might be invalid
        }
      },
    }),
    { name: 'discord-auth' }
  )
);

export const useServerStore = create<ServerState>((set) => ({
  servers: [],
  activeServer: null,
  activeChannel: null,
  showMemberList: true,
  setShowMemberList: (show) =>
    set((s) => ({
      showMemberList: typeof show === 'function' ? show(s.showMemberList) : show,
    })),
  setServers: (servers) => set({ servers }),
  setActiveServer: (server) =>
    set({
      activeServer: server,
      activeChannel: server?.channels?.[0] ?? null,
    }),
  setActiveChannel: (channel) => set({ activeChannel: channel }),
  addServer: (server) => set((s) => ({ servers: [...s.servers, server] })),
  updateServer: (server) =>
    set((s) => ({
      servers: s.servers.map((srv) => (srv.id === server.id ? server : srv)),
      activeServer: s.activeServer?.id === server.id ? server : s.activeServer,
    })),
  removeServer: (serverId) =>
    set((s) => ({
      servers: s.servers.filter((srv) => srv.id !== serverId),
      activeServer: s.activeServer?.id === serverId ? null : s.activeServer,
      activeChannel: s.activeServer?.id === serverId ? null : s.activeChannel,
    })),
  addChannelToServer: (serverId, channel) =>
    set((s) => {
      const updated = s.servers.map((srv) => {
        if (srv.id === serverId) {
          return { ...srv, channels: [...(srv.channels || []), channel] };
        }
        return srv;
      });
      const active = s.activeServer?.id === serverId
        ? { ...s.activeServer, channels: [...(s.activeServer.channels || []), channel] }
        : s.activeServer;
      return { servers: updated, activeServer: active };
    }),
  removeChannelFromServer: (serverId, channelId) =>
    set((s) => {
      const updated = s.servers.map((srv) => {
        if (srv.id === serverId) {
          return { ...srv, channels: (srv.channels || []).filter((c) => c.id !== channelId) };
        }
        return srv;
      });
      const active = s.activeServer?.id === serverId
        ? { ...s.activeServer, channels: (s.activeServer.channels || []).filter((c) => c.id !== channelId) }
        : s.activeServer;
      return { servers: updated, activeServer: active };
    }),
}));

export const useMessageStore = create<MessageState>((set) => ({
  messages: {},
  addMessage: (key, message) =>
    set((s) => {
      const existing = s.messages[key] ?? [];
      if (existing.some((m) => m.id === message.id)) return s;
      return { messages: { ...s.messages, [key]: [...existing, message] } };
    }),
  setMessages: (key, messages) =>
    set((s) => ({ messages: { ...s.messages, [key]: messages } })),
  updateMessage: (key, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [key]: (s.messages[key] ?? []).map((m) => (m.id === message.id ? message : m)),
      },
    })),
  deleteMessage: (key, messageId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [key]: (s.messages[key] ?? []).map((m) =>
          m.id === messageId
            ? { ...m, deleted: true, content: 'This message was deleted' }
            : m
        ),
      },
    })),
  updateMessageReactions: (key, messageId, reactions) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [key]: (s.messages[key] ?? []).map((m) =>
          m.id === messageId ? { ...m, reactions } : m
        ),
      },
    })),
}));

export const useVoiceStore = create<VoiceState>((set) => ({
  connectedChannel: null,
  isMuted: false,
  isDeafened: false,
  connectVoice: (channel) => set({ connectedChannel: channel }),
  disconnectVoice: () => {
    try {
      stopAllMediaStreams();
    } catch {}
    set({ connectedChannel: null });
  },
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleDeafen: () => set((s) => ({ isDeafened: !s.isDeafened })),
}));

export const useModalStore = create<ModalState>((set) => ({
  isCreateServerOpen: false,
  setCreateServerOpen: (open) => set({ isCreateServerOpen: open }),
  isJoinServerOpen: false,
  setJoinServerOpen: (open) => set({ isJoinServerOpen: open }),
  isCreateChannelOpen: false,
  setCreateChannelOpen: (open) => set({ isCreateChannelOpen: open }),
  isUserSettingsOpen: false,
  setUserSettingsOpen: (open) => set({ isUserSettingsOpen: open }),
  isInviteModalOpen: false,
  setInviteModalOpen: (open) => set({ isInviteModalOpen: open }),
  selectedUserForCard: null,
  setSelectedUserForCard: (user) => set({ selectedUserForCard: user }),
  confirmDialog: null,
  openConfirmDialog: (options) => set({ confirmDialog: options }),
  closeConfirmDialog: () => set({ confirmDialog: null }),
}));

export const useDMStore = create<DMState>((set) => ({
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  activeDMUser: null,
  setActiveDMUser: (user) => set({ activeDMUser: user }),
}));
