import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const completeRound = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updated = await prisma.round.update({
      where: { id: BigInt(id) },
      data: { status: 'COMPLETED' },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete round' });
  }
};
