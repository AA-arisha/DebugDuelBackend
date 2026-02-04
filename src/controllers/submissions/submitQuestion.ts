import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { executeCode, normalizeOutput, fetchRuntimeVersion } from '../../utils/piston';
import { getIO } from '../../socket';

const prisma = new PrismaClient();

import { AuthenticatedRequest } from '../../middlewares/authenticateUser';

export const submitQuestion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roundId, questionId } = req.params;
    let { userId, code, language } = req.body;

    // Prefer authenticated user id if present
    if (req.user && req.user.userId) userId = req.user.userId;

    if (!userId || !code || !language) {
      return res.status(400).json({ message: 'userId, code and language are required' });
    }

    // validate user
    const user = await prisma.user.findUnique({ where: { id: BigInt(userId) } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // validate round and question
    const question = await prisma.question.findUnique({
      where: { id: BigInt(questionId) },
      include: { TestCases: true, round: true }
    });

    if (!question) return res.status(404).json({ message: 'Question not found' });
    if (!question.round) return res.status(400).json({ message: 'Round not found for question' });
    if (String(question.round.id) !== String(roundId)) {
      return res.status(400).json({ message: 'Question does not belong to the provided round' });
    }

    const round = question.round;

    // Fetch or create UserQuestion (track attempts and disabled) atomically
    let userQuestion = await prisma.userQuestion.findUnique({
      where: { userId_questionId: { userId: BigInt(userId), questionId: BigInt(questionId) } }
    });

    if (!userQuestion) {
      userQuestion = await prisma.userQuestion.create({
        data: { userId: BigInt(userId), questionId: BigInt(questionId), attempts: 0, disabled: false }
      });
    }

    if (userQuestion.disabled) return res.status(400).json({ message: 'Question already solved/disabled for this user' });
    if (userQuestion.attempts >= 3) return res.status(400).json({ message: 'Maximum attempts reached for this question' });

    // Evaluate against test cases (including hidden)
    const totalTests = question.TestCases.length;
    if (totalTests === 0) return res.status(400).json({ message: 'No test cases available for this question' });

    // fetch runtime version
    const version = await fetchRuntimeVersion(language);
    if (!version) return res.status(400).json({ message: `Runtime for ${language} not available` });

    let passedAll = true;
    let failedTestIndex: number | null = null;

    for (let i = 0; i < totalTests; i++) {
      const testCase = question.TestCases[i];
      const result = await executeCode(code, language, testCase.input, version);

      if (result.run.code !== 0) {
        passedAll = false;
        failedTestIndex = i + 1;
        break;
      }

      const actualOutput = normalizeOutput(result.run.stdout);
      const expectedOutput = normalizeOutput(testCase.expectedOutput);

      if (actualOutput !== expectedOutput) {
        passedAll = false;
        failedTestIndex = i + 1;
        break;
      }
    }

    const prevAttempts = userQuestion.attempts;
    const attemptNumber = prevAttempts + 1;

    // Scoring
    const questionsInRound = await prisma.question.count({ where: { roundId: round.id } });
    const maxScore = questionsInRound > 0 ? ((round.weight ?? 0) / questionsInRound) : 0;
    let earnedScore = 0;

    if (passedAll) {
      // Deduct proportionally for previous wrong submissions (max 3 attempts)
      const deductionFactor = Math.min(prevAttempts / 3, 1);
      earnedScore = Math.max(0, Math.round(maxScore * (1 - deductionFactor)));
    }

    const timeTakenSeconds = round.startTime ? Math.floor((Date.now() - new Date(round.startTime).getTime()) / 1000) : 0;

    // Persist submission and update related entities atomically
    const [submission, lb] = await prisma.$transaction(async (tx) => {
      // create submission
      const sub = await tx.submission.create({
        data: {
          userId: BigInt(userId),
          roundId: round.id,
          questionId: question.id,
          language,
          code,
          score: earnedScore,
          attemptNumber,
          timeTakenSeconds,
          isCorrect: passedAll
        }
      });

      // update userQuestion attempts and disabled
      await tx.userQuestion.update({
        where: { userId_questionId: { userId: BigInt(userId), questionId: BigInt(questionId) } },
        data: { attempts: attemptNumber, disabled: passedAll }
      });

      // update or create leaderboard for the round
      let leaderboard = await tx.leaderboard.findUnique({
        where: { roundId_userId: { roundId: round.id, userId: BigInt(userId) } }
      });

      if (!leaderboard) {
        leaderboard = await tx.leaderboard.create({
          data: {
            userId: BigInt(userId),
            roundId: round.id,
            score: passedAll ? earnedScore : 0,
            timePenalty: passedAll ? timeTakenSeconds : 0,
            correctCount: passedAll ? 1 : 0,
            wrongCount: passedAll ? 0 : 1
          }
        });
      } else {
        await tx.leaderboard.update({
          where: { id: leaderboard.id },
          data: {
            score: passedAll ? leaderboard.score + earnedScore : leaderboard.score,
            timePenalty: passedAll ? leaderboard.timePenalty + timeTakenSeconds : leaderboard.timePenalty,
            correctCount: passedAll ? leaderboard.correctCount + 1 : leaderboard.correctCount,
            wrongCount: passedAll ? leaderboard.wrongCount : leaderboard.wrongCount + 1
          }
        });
        // refetch updated leaderboard
        leaderboard = await tx.leaderboard.findUnique({ where: { id: leaderboard.id } });
      }

      // Recalculate ranks for the round
      const allLbs = await tx.leaderboard.findMany({
        where: { roundId: round.id },
        orderBy: [{ score: 'desc' }, { timePenalty: 'asc' }]
      });

      for (let i = 0; i < allLbs.length; i++) {
        await tx.leaderboard.update({ where: { id: allLbs[i].id }, data: { rank: i + 1 } });
      }

      // update user's overall totalScore if earned
      if (passedAll && earnedScore > 0) {
        await tx.user.update({ where: { id: BigInt(userId) }, data: { totalScore: { increment: earnedScore } } });
      }

      const updatedLeaderboard = await tx.leaderboard.findUnique({
        where: { roundId_userId: { roundId: round.id, userId: BigInt(userId) } }
      });

      return [sub, updatedLeaderboard];
    });

    // Emit real-time updates via Socket.IO
    try {
      const io = getIO();

      // Round leaderboard: fetch entries for round and include user info
      const roundLbs = await prisma.leaderboard.findMany({
        where: { roundId: round.id },
        include: { user: { include: { team: true } } },
        orderBy: [{ score: 'desc' }, { timePenalty: 'asc' }]
      });

      // Build payload matching GET /rounds/:roundId/leaderboard
      const payload = await Promise.all(roundLbs.map(async (l) => {
        const subs = await prisma.submission.findMany({ where: { userId: l.userId, roundId: round.id }, orderBy: { submittedAt: 'asc' } });
        const submissions = subs.map(s => ({ questionId: s.questionId.toString(), correct: s.isCorrect, timeSubmitted: s.submittedAt }));
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
        } as any;
      }));

      io.to(`round_${roundId}`).emit('round_leaderboard_update', { roundId: round.id, leaderboard: payload });

      // Competition overall leaderboard: top users by totalScore
      const overall = await prisma.user.findMany({
        orderBy: { totalScore: 'desc' },
        take: 50,
        select: { id: true, username: true, fullName: true, totalScore: true }
      });

      io.to('competition_overall').emit('competition_leaderboard_update', {
        leaderboard: overall
      });
    } catch (ioErr) {
      console.warn('Socket emit failed (socket may not be initialized yet):', ioErr);
    }

    // Build submissions summary for returning to frontend
    const userSubmissions = await prisma.submission.findMany({ where: { userId: BigInt(userId), questionId: question.id }, orderBy: { submittedAt: 'asc' } });

    const submissionsSummary = userSubmissions.map(s => ({
      questionId: s.questionId.toString(),
      userId: s.userId.toString(),
      timeSubmitted: s.submittedAt,
      correct: s.isCorrect,
      attemptNumber: s.attemptNumber,
      score: s.score
    }));

    return res.status(200).json({
      success: true,
      solved: passedAll,
      passedTests: passedAll ? totalTests : totalTests - (failedTestIndex ?? 0),
      totalTests,
      attempts: attemptNumber,
      message: passedAll ? 'All tests passed' : `Failed on test ${failedTestIndex}`,
      submissions: submissionsSummary
    });
  } catch (err: any) {
    console.error('Submit question error:', err);
    return res.status(500).json({ message: 'Submission processing failed', error: err?.message || String(err) });
  }
};
