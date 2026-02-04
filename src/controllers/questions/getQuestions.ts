import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getQuestions = async (req: Request, res: Response) => {
  const { roundId } = req.params;

  try {
    const questions = await prisma.question.findMany({
      where: { roundId: BigInt(roundId) },
      include: {
        TestCases: true,    // include all test cases
        BuggyCodes: true,   // include all buggy codes
      },
      orderBy: { id: 'asc' } // optional: order by creation
    });

    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};
