import { useEffect, useRef } from 'react';
import { getStompClient, onStompConnect } from '@/lib/stomp';
import { useMessageStore, useAuthStore } from '@/store';
import { WsMessage } from '@/types';

export function useChannelSocket(
  channelId: number | null,
  onTyping?: (username: string, typing: boolean) => void
) {
  const currentUser = useAuthStore((s) => s.user);
  const { addMessage, updateMessage, deleteMessage, updateMessageReactions } = useMessageStore();
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);
  const typingSubRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (!channelId) return;
    const client = getStompClient();
    const key = `channel-${channelId}`;

    const subscribe = () => {
      if (!client.connected) return;

      subRef.current?.unsubscribe();
      subRef.current = client.subscribe(`/topic/channel/${channelId}`, (frame) => {
        try {
          const ws: WsMessage = JSON.parse(frame.body);
          if (ws.type === 'CHAT' && ws.message) {
            addMessage(key, ws.message);
          } else if (ws.type === 'MESSAGE_EDIT' && ws.message) {
            updateMessage(key, ws.message);
          } else if (ws.type === 'MESSAGE_DELETE' && ws.messageId) {
            deleteMessage(key, ws.messageId);
          } else if (ws.type === 'REACTION' && ws.messageId && ws.reactions) {
            updateMessageReactions(key, ws.messageId, ws.reactions);
          }
        } catch (e) {
          console.error('Error parsing channel socket message', e);
        }
      });

      if (onTyping) {
        typingSubRef.current?.unsubscribe();
        typingSubRef.current = client.subscribe(
          `/topic/channel/${channelId}/typing`,
          (frame) => {
            try {
              const ws: WsMessage = JSON.parse(frame.body);
              if (ws.username) {
                const isMe =
                  ws.username === currentUser?.username ||
                  ws.username === currentUser?.displayName ||
                  ws.username === currentUser?.email;
                if (!isMe) {
                  onTyping(ws.username, !!ws.typing);
                }
              }
            } catch (e) {
              console.error('Error parsing typing message', e);
            }
          }
        );
      }
    };

    const unsubscribeConnect = onStompConnect(subscribe);
    subscribe();

    return () => {
      subRef.current?.unsubscribe();
      typingSubRef.current?.unsubscribe();
      unsubscribeConnect();
    };
  }, [channelId, addMessage, updateMessage, deleteMessage, updateMessageReactions, onTyping, currentUser]);
}

export function useDMSocket(
  otherUserId: number | null,
  onTyping?: (username: string, typing: boolean) => void
) {
  const currentUser = useAuthStore((s) => s.user);
  const { addMessage, updateMessage, deleteMessage, updateMessageReactions } = useMessageStore();
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);
  const typingSubRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    if (!otherUserId) return;
    const client = getStompClient();
    const key = `dm-${otherUserId}`;

    const subscribe = () => {
      if (!client.connected) return;

      subRef.current?.unsubscribe();
      subRef.current = client.subscribe('/user/queue/dm', (frame) => {
        try {
          const ws: WsMessage = JSON.parse(frame.body);
          if (ws.type === 'CHAT' && ws.message) {
            addMessage(key, ws.message);
          } else if (ws.type === 'MESSAGE_EDIT' && ws.message) {
            updateMessage(key, ws.message);
          } else if (ws.type === 'MESSAGE_DELETE' && ws.messageId) {
            deleteMessage(key, ws.messageId);
          } else if (ws.type === 'REACTION' && ws.messageId && ws.reactions) {
            updateMessageReactions(key, ws.messageId, ws.reactions);
          }
        } catch (e) {
          console.error('Error parsing DM socket message', e);
        }
      });

      if (onTyping) {
        typingSubRef.current?.unsubscribe();
        typingSubRef.current = client.subscribe('/user/queue/dm/typing', (frame) => {
          try {
            const ws: WsMessage = JSON.parse(frame.body);
            if (ws.username) {
              const isMe =
                ws.username === currentUser?.username ||
                ws.username === currentUser?.displayName ||
                ws.username === currentUser?.email;
              if (!isMe) {
                onTyping(ws.username, !!ws.typing);
              }
            }
          } catch (e) {
            console.error('Error parsing DM typing message', e);
          }
        });
      }
    };

    const unsubscribeConnect = onStompConnect(subscribe);
    subscribe();

    return () => {
      subRef.current?.unsubscribe();
      typingSubRef.current?.unsubscribe();
      unsubscribeConnect();
    };
  }, [otherUserId, addMessage, updateMessage, deleteMessage, updateMessageReactions, onTyping, currentUser]);
}
