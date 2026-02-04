import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const unlockRound = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const round = await prisma.round.findUnique({ where: { id: BigInt(id) } });
    if (!round) return res.status(404).json({ error: 'Round not found' });
    if (round.status !== 'LOCKED') return res.status(400).json({ error: 'Only LOCKED rounds can be unlocked' });

    const updated = await prisma.round.update({ where: { id: BigInt(id) }, data: { status: 'UNLOCKED' } });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unlock round' });
  }
};
