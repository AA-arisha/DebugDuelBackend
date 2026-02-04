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
      socket.on('joinRound', (roundId: string) => {
        socket.join(`round_${roundId}`);
      });
      socket.on('joinCompetition', () => {
        socket.join('competition_overall');
      });
    });
  }
  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
