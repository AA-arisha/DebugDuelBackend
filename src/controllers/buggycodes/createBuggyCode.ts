import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isEditable } from '../../utils/roundHelpers';
const prisma = new PrismaClient();

export const createBuggyCode = async (req: Request, res: Response) => {
  const { questionId } = req.params;
  const { language, code } = req.body;

  try {
    const question = await prisma.question.findUnique({
      where: { id: BigInt(questionId) },
      include: { round: true },
    });

    if (!question) return res.status(404).json({ error: 'Question not found' });
    if (!isEditable(question.round)) return res.status(400).json({ error: 'Cannot add buggy code to active round' });

    const buggyCode = await prisma.buggyCode.create({
      data: { questionId: BigInt(questionId), language, code },
    });

    res.status(201).json(buggyCode);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create buggy code' });
  }
};
