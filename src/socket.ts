import { Server as IOServer } from 'socket.io';
import http from 'http';

let io: IOServer | null = null;

export const initSocket = (server: http.Server) => {
  if (!io) {
    io = new IOServer(server, {
      cors: { origin: '*' },
     
    });

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);
      // Join a per-round room
      socket.on('joinRound', (roundId: string) => {
        socket.join(`round_${roundId}`);
      });

      // Join the global competition room
      socket.on('joinCompetition', () => {
        socket.join('competition_overall');
      });

      // Backwards-compatible aliases: some older clients emit 'join'/'leave'
      socket.on('join', (room: string) => {
        if (room === 'competition_overall') socket.join('competition_overall');
        else socket.join(`round_${room}`);
      });

      // Allow clients to explicitly leave rooms
      socket.on('leaveRound', (roundId: string) => {
        socket.leave(`round_${roundId}`);
      });
      socket.on('leaveCompetition', () => {
        socket.leave('competition_overall');
      });

      // Backwards-compatible alias for leave
      socket.on('leave', (room: string) => {
        if (room === 'competition_overall') socket.leave('competition_overall');
        else socket.leave(`round_${room}`);
      });
    });
  }
  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
