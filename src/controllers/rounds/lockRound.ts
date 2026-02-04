import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const lockRound = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const round = await prisma.round.findUnique({ where: { id: BigInt(id) } });
    if (!round) return res.status(404).json({ error: 'Round not found' });
    if (round.status !== 'UNLOCKED') return res.status(400).json({ error: 'Only UNLOCKED rounds can be locked' });

    const updated = await prisma.round.update({ where: { id: BigInt(id) }, data: { status: 'LOCKED' } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to lock round' });
  }
};
