import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getSocketUrl(): string {
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl) {
    // Strip trailing /api or /api/
    return envApiUrl.replace(/\/api\/?$/, '');
  }
  // Fallback to origin or localhost:5000 in dev
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
}

export function getSocket(): Socket {
  if (!socket) {
    const url = getSocketUrl();
    socket = io(url, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect_error', (err) => {
      // Non-fatal warning so application continues working gracefully via standard REST APIs
      console.warn('[Socket] Connection warning:', err.message);
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function subscribeToCircle(circleId: string): void {
  const s = getSocket();
  if (s.connected) {
    s.emit('circle:subscribe', circleId);
  } else {
    s.once('connect', () => {
      s.emit('circle:subscribe', circleId);
    });
  }
}

export function unsubscribeFromCircle(circleId: string): void {
  if (socket && socket.connected) {
    socket.emit('circle:unsubscribe', circleId);
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
