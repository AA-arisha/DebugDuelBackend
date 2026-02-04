import { Request, Response } from 'express';
import prisma from '../../../prismaClient';

// GET /admin/rounds/:roundId/submissions?questionId=&userId=
export const index = async (req: Request, res: Response) => {
  try {
    const { roundId } = req.params;
    const { questionId, userId } = req.query as any;

    const where: any = { roundId: BigInt(roundId) };
    if (questionId) where.questionId = BigInt(questionId);
    if (userId) where.userId = BigInt(userId);

    const submissions = await prisma.submission.findMany({
      where,
      include: { user: { select: { id: true, username: true } }, question: true },
      orderBy: { submittedAt: 'desc' }
    });

    const result = submissions.map(s => ({
      id: s.id.toString(),
      userId: s.userId,
      username: s.user?.username,
      questionId: s.questionId,
      correct: s.isCorrect,
      score: s.score,
      attemptNumber: s.attemptNumber,
      submittedAt: s.submittedAt,
      language: s.language
    }));

    res.json(result);
  } catch (err) {
    console.error('Admin submissions index error', err);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
};