export type UserStatus = 'ONLINE' | 'IDLE' | 'DND' | 'OFFLINE';

export interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  status: UserStatus | string;
  online: boolean;
}

export interface Reaction {
  emoji: string;
  count: number;
  usernames: string[];
  reactedByMe: boolean;
}

export interface Message {
  id: number;
  content: string;
  fileUrl?: string;
  fileName?: string;
  edited: boolean;
  deleted: boolean;
  sender: User;
  channelId?: number;
  directMessageId?: number;
  reactions?: Reaction[];
  createdAt: string;
  updatedAt?: string;
}

export interface Channel {
  id: number;
  name: string;
  type: 'TEXT' | 'VOICE' | 'ANNOUNCEMENT';
  description?: string;
  serverId: number;
  createdAt: string;
}

export interface Server {
  id: number;
  name: string;
  description?: string;
  iconUrl?: string;
  inviteCode: string;
  owner: User;
  channels: Channel[];
  members?: User[];
  memberCount: number;
  createdAt: string;
}

export interface DirectMessageConversation {
  id: number;
  otherUser: User;
  lastMessage?: Message;
  updatedAt: string;
}

export interface WsMessage {
  type: 'CHAT' | 'TYPING' | 'PRESENCE' | 'MESSAGE_EDIT' | 'MESSAGE_DELETE' | 'REACTION';
  message?: Message;
  channelId?: number;
  dmId?: number;
  username?: string;
  typing?: boolean;
  messageId?: number;
  reactionEmoji?: string;
  reactions?: Reaction[];
}
