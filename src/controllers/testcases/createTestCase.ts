import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isEditable } from '../../utils/roundHelpers';
const prisma = new PrismaClient();

export const createTestCase = async (req: Request, res: Response) => {
  const { questionId } = req.params;
  const { input, expectedOutput, isVisible } = req.body;

  try {
    const question = await prisma.question.findUnique({
      where: { id: BigInt(questionId) },
      include: { round: true },
    });

    if (!question) return res.status(404).json({ error: 'Question not found' });
    if (!isEditable(question.round)) return res.status(400).json({ error: 'Cannot add test case to active round' });

    const testCase = await prisma.testCase.create({
      data: { questionId: BigInt(questionId), input, expectedOutput, isVisible: Boolean(isVisible) },
    });

    res.status(201).json(testCase);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create test case' });
  }
};
