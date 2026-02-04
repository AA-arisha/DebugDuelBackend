import { Request, Response } from 'express';
import prisma from '../../../prismaClient';

export const show = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const submission = await prisma.submission.findUnique({ where: { id: BigInt(id) }, include: { user: true, question: true } });
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    res.json({
      id: submission.id.toString(),
      userId: submission.userId,
      username: submission.user?.username,
      questionId: submission.questionId,
      language: submission.language,
      code: submission.code,
      score: submission.score,
      attemptNumber: submission.attemptNumber,
      isCorrect: submission.isCorrect,
      submittedAt: submission.submittedAt
    });
  } catch (err) {
    console.error('Admin submissions show error', err);
    res.status(500).json({ message: 'Failed to fetch submission' });
  }
};