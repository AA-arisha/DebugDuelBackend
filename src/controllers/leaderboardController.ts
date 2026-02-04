import { Request, Response } from 'express';
import prisma from '../prismaClient';


// Round leaderboard: per-user entries with submissions summary
export const roundLeaderboard = async (req: Request, res: Response) => {
  try {
    const { roundId } = req.params;
    if (!roundId) return res.status(400).json({ message: 'roundId required' });

    const lbs = await prisma.leaderboard.findMany({
      where: { roundId: BigInt(roundId) },
      include: { user: { include: { team: true } } },
      orderBy: [{ score: 'desc' }, { timePenalty: 'asc' }]
    });

    // For each leaderboard entry, gather per-question submissions for that user in the round
    const result = await Promise.all(lbs.map(async (l) => {
      const subs = await prisma.submission.findMany({ where: { userId: l.userId, roundId: BigInt(roundId) }, orderBy: { submittedAt: 'asc' } });
      const submissions = subs.map(s => ({
        questionId: s.questionId.toString(),
        correct: s.isCorrect,
        timeSubmitted: s.submittedAt
      }));

      return {
        userId: l.userId,
        teamName: l.user?.team ? l.user.team.name : l.user?.username,
        username: l.user?.username,
        rank: l.rank,
        score: l.score,
        correctCount: l.correctCount,
        wrongCount: l.wrongCount,
        timePenalty: l.timePenalty,
        submissions
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('Round leaderboard error', err);
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
};

// Competition leaderboard: aggregate by user.totalScore
export const competitionLeaderboard = async (req: Request, res: Response) => {
  try {
    const top = await prisma.user.findMany({ orderBy: { totalScore: 'desc' }, take: 100, include: { team: true } });

    const result = top.map(u => ({
      userId: u.id.toString(),
      username: u.username,
      teamName: u.team ? u.team.name : u.username,
      totalScore: (u as any).totalScore ?? 0
    }));

    res.json(result);
  } catch (err) {
    console.error('Competition leaderboard error', err);
    res.status(500).json({ message: 'Failed to fetch competition leaderboard' });
  }
};