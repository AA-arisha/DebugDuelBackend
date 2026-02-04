import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isEditable } from '../../utils/roundHelpers';
const prisma = new PrismaClient();

export const updateQuestion = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, problemStatement } = req.body;

  try {
    const question = await prisma.question.findUnique({ where: { id: BigInt(id) } });
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const round = await prisma.round.findUnique({ where: { id: question.roundId } });
    if (!isEditable(round!)) return res.status(400).json({ error: 'Cannot edit question in active round' });

    const updated = await prisma.question.update({
      where: { id: BigInt(id) },
      data: { title, problemStatement },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update question' });
  }
};
