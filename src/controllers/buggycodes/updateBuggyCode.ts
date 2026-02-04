import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isEditable } from '../../utils/roundHelpers';
const prisma = new PrismaClient();

export const updateBuggyCode = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { language, code } = req.body;

  try {
    const buggyCode = await prisma.buggyCode.findUnique({
      where: { id: BigInt(id) },
      include: { question: { include: { round: true } } },
    });

    if (!buggyCode) return res.status(404).json({ error: 'Buggy code not found' });
    if (!isEditable(buggyCode.question.round)) return res.status(400).json({ error: 'Cannot edit buggy code in active round' });

    const updated = await prisma.buggyCode.update({
      where: { id: BigInt(id) },
      data: { language, code },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update buggy code' });
  }
};
