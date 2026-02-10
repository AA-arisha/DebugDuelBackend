import { Router, Request, Response } from 'express';
import prisma from '../prismaClient';
import { authenticateUser } from '../middlewares/authenticateUser';

const router = Router();

// Get all solved questions for a user
router.get('/solved-questions/:userId', authenticateUser(), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Fetch all correct submissions for the user (distinct by questionId)
    const solvedSubmissions = await prisma.submission.findMany({
      where: {
        userId: BigInt(userId),
        isCorrect: true, // Only get correct submissions
      },
      select: {
        questionId: true,
      },
      distinct: ['questionId'],
    });

    const solvedQuestionIds = solvedSubmissions.map(s => s.questionId.toString());

    res.json({ solvedQuestionIds });
  } catch (error) {
    console.error('Error fetching solved questions:', error);
    res.status(500).json({ error: 'Failed to fetch solved questions' });
  }
});

export default router;
