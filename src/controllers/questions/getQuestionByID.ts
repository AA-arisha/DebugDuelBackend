// controllers/question.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getQuestionById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const question = await prisma.question.findUnique({
    where: { id: BigInt(id) },
    include: {
      TestCases: true,
      BuggyCodes: true,
    },
  });

  if (!question) {
    return res.status(404).json({ message: 'Question not found' });
  }

  // 🔥 SHAPE DATA FOR FRONTEND
  res.json({
    id: question.id.toString(),
    title: question.title,
    problemStatement: question.problemStatement,
    roundId: question.roundId,
    testcases: question.TestCases.map(tc => ({
      id: tc.id.toString(),
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      description: tc.description,
      isVisible: tc.isVisible,
    })),
    buggyCodes: question.BuggyCodes.map(bc => ({
      id: bc.id.toString(),
      language: bc.language,
      code: bc.code,
    })),
  });
};
