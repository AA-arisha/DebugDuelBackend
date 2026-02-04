import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isEditable } from '../../utils/roundHelpers';
const prisma = new PrismaClient();

export const deleteBuggyCode = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const buggyCode = await prisma.buggyCode.findUnique({
      where: { id: BigInt(id) },
      include: { question: { include: { round: true } } },
    });

    if (!buggyCode) return res.status(404).json({ error: 'Buggy code not found' });
    if (!isEditable(buggyCode.question.round)) return res.status(400).json({ error: 'Cannot delete buggy code in active round' });

    await prisma.buggyCode.delete({ where: { id: BigInt(id) } });
    res.json({ message: 'Buggy code deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete buggy code' });
  }
};
