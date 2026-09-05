import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient: Client | null = null;
const connectListeners = new Set<() => void>();

export const getStompClient = (): Client => {
  if (!stompClient) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      reconnectDelay: 4000,
      onConnect: () => {
        connectListeners.forEach((listener) => {
          try {
            listener();
          } catch (e) {
            console.error('Error in STOMP connect listener', e);
          }
        });
      },
    });

    stompClient.activate();
  }
  return stompClient;
};

export const onStompConnect = (callback: () => void): (() => void) => {
  connectListeners.add(callback);
  const client = getStompClient();
  if (client.connected) {
    callback();
  }
  return () => {
    connectListeners.delete(callback);
  };
};

export const disconnectStomp = () => {
  if (stompClient) {
    connectListeners.clear();
    stompClient.deactivate();
    stompClient = null;
  }
};
