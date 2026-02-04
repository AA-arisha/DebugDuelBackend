import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isEditable } from '../../utils/roundHelpers';
const prisma = new PrismaClient();

export const updateTestCase = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { input, expectedOutput, isVisible } = req.body;

  try {
    const testCase = await prisma.testCase.findUnique({
      where: { id: BigInt(id) },
      include: { question: { include: { round: true } } },
    });

    if (!testCase) return res.status(404).json({ error: 'Test case not found' });
    if (!isEditable(testCase.question.round)) return res.status(400).json({ error: 'Cannot edit test case in active round' });

    const updated = await prisma.testCase.update({
      where: { id: BigInt(id) },
      data: { input, expectedOutput, isVisible: Boolean(isVisible) },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update test case' });
  }
};
