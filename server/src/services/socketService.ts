import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '../config/index.js';
import { verifyToken, AUTH_COOKIE_NAME } from '../utils/token.js';
import { User, IUser } from '../models/User.js';
import { StudyCircleMembership } from '../models/StudyCircleMembership.js';

let io: SocketIOServer | null = null;

export interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
    user?: IUser;
  };
}

/**
 * Parses raw Cookie header string to extract specific cookie value.
 */
const parseCookie = (cookieHeader: string | undefined, name: string): string | null => {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.substring(name.length + 1)) : null;
};

/**
 * Initializes Socket.IO server and binds authentication and room handlers.
 */
export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      // 1. Try auth object, then raw cookie header
      const token =
        socket.handshake.auth?.token ||
        parseCookie(socket.handshake.headers.cookie, AUTH_COOKIE_NAME);

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).lean();

      if (!user) {
        return next(new Error('User not found or session invalid'));
      }

      socket.data.userId = user._id.toString();
      socket.data.user = user as unknown as IUser;
      next();
    } catch {
      next(new Error('Invalid or expired authentication token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.data.userId;

    // Join circle room - verifies membership before allowing subscription
    socket.on('circle:subscribe', async (data: { circleId: string }) => {
      try {
        if (!data?.circleId || !userId) {
          socket.emit('circle:error', { message: 'Invalid circle ID' });
          return;
        }

        const isMember = await StudyCircleMembership.exists({
          circleId: data.circleId,
          userId,
        });

        if (!isMember) {
          socket.emit('circle:error', { message: 'Not authorized for this study circle' });
          return;
        }

        const roomName = `circle:${data.circleId}`;
        socket.join(roomName);
      } catch (err) {
        console.error('Error subscribing to circle room:', err);
        socket.emit('circle:error', { message: 'Failed to subscribe to circle' });
      }
    });

    // Leave circle room
    socket.on('circle:unsubscribe', (data: { circleId: string }) => {
      if (data?.circleId) {
        socket.leave(`circle:${data.circleId}`);
      }
    });

    socket.on('disconnect', () => {
      // Socket disconnected cleanly
    });
  });

  return io;
};

/**
 * Emits an event to all subscribers in a specific circle room.
 */
export const emitToCircle = (
  circleId: string,
  event: string,
  payload: unknown
): void => {
  if (io) {
    io.to(`circle:${circleId}`).emit(event, payload);
  }
};

/**
 * Retrieves the Socket.IO instance.
 */
export const getIO = (): SocketIOServer | null => io;
