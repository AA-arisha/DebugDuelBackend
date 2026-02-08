// backend/controllers/roundController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getIO } from '../../socket';

const prisma = new PrismaClient();

// Start a round
export const startRound = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const roundId = BigInt(id);

    const round = await prisma.round.findUnique({ where: { id: roundId } });
    if (!round) return res.status(404).json({ error: 'Round not found' });
    if (round.status !== 'UNLOCKED')
      return res.status(400).json({ error: 'Only UNLOCKED rounds can be started' });

    const now = new Date();
    const endTime = new Date(now.getTime() + round.duration * 60 * 1000);

    // Update round in DB
    const updated = await prisma.round.update({
      where: { id: roundId },
      data: { status: 'ACTIVE', startTime: now, endsAt: endTime },
    });

    // Serialize BigInt and normalize time fields for frontend
    const serialized = {
      ...updated,
      id: updated.id.toString(),
      startAt: updated.startTime ?? null,
      endAt: updated.endsAt ?? null,
      startTime: updated.startTime ?? null,
      endsAt: updated.endsAt ?? null,
    };

    // Emit to all participants
    const io = getIO();
    io.to(`round_${serialized.id}`).emit('round_started', {
      ...serialized,
      serverTime: Date.now(),
    });
    io.to('competition_overall').emit('round_updated', serialized);

    // Schedule auto-complete
    setTimeout(async () => {
      try {
        const finished = await prisma.round.update({
          where: { id: roundId },
          data: { status: 'COMPLETED', endsAt: new Date() },
        });
        const serializedFinished = {
          ...finished,
          id: finished.id.toString(),
          startAt: finished.startTime ?? null,
          endAt: finished.endsAt ?? null,
          startTime: finished.startTime ?? null,
          endsAt: finished.endsAt ?? null,
        };
        io.to(`round_${serializedFinished.id}`).emit('round_stopped', {
          ...serializedFinished,
          serverTime: Date.now(),
        });
        io.to('competition_overall').emit('round_updated', serializedFinished);
      } catch (err) {
        console.error('Failed to auto-complete round:', err);
      }
    }, round.duration * 60 * 1000);

    res.json(serialized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start round' });
  }
};

// Stop round manually
export const stopRound = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const roundId = BigInt(id);
    const round = await prisma.round.findUnique({ where: { id: roundId } });
    if (!round) return res.status(404).json({ error: 'Round not found' });

    const updated = await prisma.round.update({
      where: { id: roundId },
      data: { status: 'COMPLETED', endsAt: new Date() },
    });
    const serialized = {
      ...updated,
      id: updated.id.toString(),
      startAt: updated.startTime ?? null,
      endAt: updated.endsAt ?? null,
      startTime: updated.startTime ?? null,
      endsAt: updated.endsAt ?? null,
    };

    const io = getIO();
    io.to(`round_${serialized.id}`).emit('round_stopped', {
      ...serialized,
      serverTime: Date.now(),
    });
    io.to('competition_overall').emit('round_updated', serialized);

    res.json(serialized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to stop round' });
  }
};
