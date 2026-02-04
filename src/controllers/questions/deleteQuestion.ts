import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isEditable } from '../../utils/roundHelpers';
const prisma = new PrismaClient();

export const deleteQuestion = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const question = await prisma.question.findUnique({ where: { id: BigInt(id) } });
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const round = await prisma.round.findUnique({ where: { id: question.roundId } });
    if (!isEditable(round!)) return res.status(400).json({ error: 'Cannot delete question in active round' });

    await prisma.question.delete({ where: { id: BigInt(id) } });
    res.json({ message: 'Question deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
};
