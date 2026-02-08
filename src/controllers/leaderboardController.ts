import { Request, Response } from 'express';
import prisma from '../prismaClient';

// Round leaderboard: per-user entries with submissions summary (optimized)
export const roundLeaderboard = async (req: Request, res: Response) => {
  try {
    const { roundId } = req.params;
    if (!roundId) return res.status(400).json({ message: 'roundId required' });

    // 1️⃣ Fetch all leaderboard entries with user and team info
    const lbs = await prisma.leaderboard.findMany({
      where: { roundId: BigInt(roundId) },
      include: { user: { include: { team: true } } },
      orderBy: [{ score: 'desc' }, { timePenalty: 'asc' }],
    });

    // 2️⃣ Fetch all submissions for this round at once
    const allUserIds = lbs.map(l => l.userId);
    const allSubs = await prisma.submission.findMany({
      where: { roundId: BigInt(roundId), userId: { in: allUserIds } },
      orderBy: { submittedAt: 'asc' },
    });

    // 3️⃣ Fetch all questions used in these submissions at once
    const questionIds = Array.from(new Set(allSubs.map(s => s.questionId)));
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
    });
    const questionMap = new Map<number, string>();
    questions.forEach(q => questionMap.set(Number(q.id), q.title));

    // 4️⃣ Group submissions by userId
    const subsByUser = new Map<number, typeof allSubs>();
    allUserIds.forEach(uid => subsByUser.set(Number(uid), []));
    allSubs.forEach(s => {
      const arr = subsByUser.get(Number(s.userId));
      if (arr) arr.push(s);
    });

    // 5️⃣ Build final result
    const result = lbs.map(l => {
      const userSubs = subsByUser.get(Number(l.userId)) || [];
      const submissions = userSubs.map(s => ({
        questionId: s.questionId.toString(),
        questionTitle: questionMap.get(Number(s.questionId)) ?? `Question ${s.questionId}`,
        correct: s.isCorrect,
        timeSubmitted: s.submittedAt,
      }));

      return {
        id: l.userId, // frontend key
        userId: l.userId,
        username: l.user?.username,
        userName: l.user?.username,
        teamName: l.user?.team ? l.user.team.name : l.user?.username,
        rank: l.rank,
        score: l.score,
        correctCount: l.correctCount,
        wrongCount: l.wrongCount,
        timePenalty: l.timePenalty,
        submissions,
      };
    });

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