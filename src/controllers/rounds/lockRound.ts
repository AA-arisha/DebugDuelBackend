import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getIO } from '../../socket';

const prisma = new PrismaClient();

export const lockRound = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const roundId = BigInt(id);

    const round = await prisma.round.findUnique({
      where: { id: roundId }
    });

    if (!round) {
      return res.status(404).json({ error: 'Round not found' });
    }

    if (round.status !== 'UNLOCKED') {
      return res.status(400).json({
        error: 'Only UNLOCKED rounds can be locked'
      });
    }

    // 1️⃣ Update DB
    const updated = await prisma.round.update({
      where: { id: roundId },
      data: { status: 'LOCKED' }
    });

    // 2️⃣ Serialize BigInt fields before emitting
    const serializedRound = {
      ...updated,
      id: updated.id.toString(),
      startAt: updated.startTime ?? null,
      endAt: updated.endsAt ?? null,
      startTime: updated.startTime ?? null,
      endsAt: updated.endsAt ?? null,
    };

    // 3️⃣ Emit socket updates
    const io = getIO();
    const roomName = `round_${serializedRound.id}`;
    io.to(roomName).emit('round_updated', serializedRound);
    io.to('competition_overall').emit('round_updated', serializedRound);

    // 4️⃣ Respond to admin
    res.json(serializedRound);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to lock round' });
  }
};
