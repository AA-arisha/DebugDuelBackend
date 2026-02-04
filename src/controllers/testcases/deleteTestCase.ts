import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isEditable } from '../../utils/roundHelpers';
const prisma = new PrismaClient();

export const deleteTestCase = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const testCase = await prisma.testCase.findUnique({
      where: { id: BigInt(id) },
      include: { question: { include: { round: true } } },
    });

    if (!testCase) return res.status(404).json({ error: 'Test case not found' });
    if (!isEditable(testCase.question.round)) return res.status(400).json({ error: 'Cannot delete test case in active round' });

    await prisma.testCase.delete({ where: { id: BigInt(id) } });
    res.json({ message: 'Test case deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete test case' });
  }
};
