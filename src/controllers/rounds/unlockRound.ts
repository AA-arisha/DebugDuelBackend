import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getIO } from '../../socket';

const prisma = new PrismaClient();

export const unlockRound = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const roundId = BigInt(id);

    // 1️⃣ Fetch round
    const round = await prisma.round.findUnique({ where: { id: roundId } });
    if (!round) return res.status(404).json({ error: 'Round not found' });

    if (round.status !== 'LOCKED') {
      return res.status(400).json({ error: 'Only LOCKED rounds can be unlocked' });
    }

    // 2️⃣ Update round status
    const updated = await prisma.round.update({
      where: { id: roundId },
      data: { status: 'UNLOCKED' },
    });

    // 3️⃣ Serialize BigInt fields for socket
    const serializedRound = {
      ...updated,
      id: updated.id.toString(),
      startAt: updated.startTime ?? null,
      endAt: updated.endsAt ?? null,
      startTime: updated.startTime ?? null,
      endsAt: updated.endsAt ?? null,
    };

    // 4️⃣ Emit updates via Socket.IO
    const io = getIO();
    io.to(`round_${serializedRound.id}`).emit('round_updated', serializedRound);
    io.to('competition_overall').emit('round_updated', serializedRound);

    // 5️⃣ Respond
    res.json(serializedRound);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unlock round' });
  }
};
