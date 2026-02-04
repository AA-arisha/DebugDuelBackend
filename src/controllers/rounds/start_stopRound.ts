import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Keep track of active timers in memory
const activeTimers: { [roundId: string]: NodeJS.Timeout } = {};

export const startRound = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const round = await prisma.round.findUnique({ where: { id: BigInt(id) } });

    if (!round) return res.status(404).json({ error: 'Round not found' });
    if (round.status !== 'UNLOCKED')
      return res.status(400).json({ error: 'Only UNLOCKED rounds can be started' });

    const now = new Date();
    const endTime = new Date(now.getTime() + round.duration * 60 * 1000);

    // Update round to ACTIVE
    const updated = await prisma.round.update({
      where: { id: BigInt(id) },
      data: { status: 'ACTIVE', startTime: now, endsAt: endTime },
    });

    // ✅ Schedule automatic completion
    const durationMs = round.duration * 60 * 1000;
    if (activeTimers[id]) clearTimeout(activeTimers[id]); // clear existing timer
    activeTimers[id] = setTimeout(async () => {
      try {
        await prisma.round.update({
          where: { id: BigInt(id) },
          data: { status: 'COMPLETED' },
        });
        delete activeTimers[id];
        console.log(`Round ${id} automatically completed`);
      } catch (err) {
        console.error(`Failed to auto-complete round ${id}:`, err);
      }
    }, durationMs);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start round' });
  }
};

// -------------------- Stop Round Manually --------------------
export const stopRound = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const round = await prisma.round.findUnique({ where: { id: BigInt(id) } });
    if (!round) return res.status(404).json({ error: 'Round not found' });

    // Cancel any scheduled auto-completion
    if (activeTimers[id]) {
      clearTimeout(activeTimers[id]);
      delete activeTimers[id];
    }

    const updated = await prisma.round.update({
      where: { id: BigInt(id) },
      data: { status: 'COMPLETED', endsAt: new Date() },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to stop round' });
  }
};
