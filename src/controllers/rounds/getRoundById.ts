import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getRoundDetailsById = async (req: Request, res: Response) => {
  const { roundId } = req.params;


  if (!roundId) {
    return res.status(400).json({ error: "Round ID is required" });
  }

  try {
    const round = await prisma.round.findUnique({
      where: { id: BigInt(roundId) },
      include: {
        Questions: { include: { TestCases: true, BuggyCodes: true } },
        Submissions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                team: { select: { id: true, name: true } },
              },
            },
            question: { select: { id: true, title: true } },
          },
          orderBy: { submittedAt: 'asc' },
        },
      },
    });

    if (!round) return res.status(404).json({ error: "Round not found" });

    const teamMap: Record<string, any> = {};
    const userAttemptMap: Record<string, Record<string, any>> = {}; // userId -> questionId -> {attempts, solved}

    for (const submission of round.Submissions) {
      // Convert bigint IDs to string for object keys
      const teamId = submission.user.team?.id?.toString() ?? `user-${submission.user.id.toString()}`;
      const userId = submission.user.id.toString();
      const questionId = submission.questionId.toString();

      // Initialize team
      if (!teamMap[teamId]) {
        teamMap[teamId] = {
          teamId: submission.user.team?.id ?? null,
          teamName: submission.user.team?.name ?? submission.user.username,
          totalScore: 0,
          totalTimePenalty: 0,
          perQuestionScores: {}, // questionId -> score
          submissions: [],
        };
      }

      // Initialize user attempts map
      if (!userAttemptMap[userId]) userAttemptMap[userId] = {};
      if (!userAttemptMap[userId][questionId]) {
        userAttemptMap[userId][questionId] = { attempts: 0, solved: false };
      }

      const qAttempt = userAttemptMap[userId][questionId];

      // Process submission only if question not solved & attempts < 3
      if (!qAttempt.solved && qAttempt.attempts < 3) {
        qAttempt.attempts += 1;

        if (submission.isCorrect) {
          qAttempt.solved = true;

          // Score decreases with attempts
          const score = Math.max(0, 4 - qAttempt.attempts); // 1st try=3, 2nd=2, 3rd=1

          // Save per-question score per team
          if (!teamMap[teamId].perQuestionScores[questionId]) {
            teamMap[teamId].perQuestionScores[questionId] = score;
          } else {
            // Keep highest score per question for team
            teamMap[teamId].perQuestionScores[questionId] = Math.max(
              teamMap[teamId].perQuestionScores[questionId],
              score
            );
          }
        }
      }

      // Store submission for admin/debug
      teamMap[teamId].submissions.push({
        submissionId: submission.id,
        questionId: submission.questionId,
        questionTitle: submission.question.title,
        userId: submission.userId,
        username: submission.user.username,
        fullName: submission.user.fullName,
        language: submission.language,
        code: submission.code,
        score: submission.score,
        timeTakenSeconds: submission.timeTakenSeconds,
        isCorrect: submission.isCorrect,
        submittedAt: submission.submittedAt,
      });
    }

    // Compute total score & total time penalty per team
    for (const team of Object.values(teamMap)) {
      // totalScore
        team.totalScore = (Object.values(team.perQuestionScores) as number[]).reduce(
        (sum: number, score: number) => sum + score,
        0
        );

        // totalTimePenalty
        team.totalTimePenalty = team.submissions.reduce(
        (sum: number, s: any) => sum + (s.timeTakenSeconds ?? 0),
        0
        );

    }

    // Sort leaderboard
    const aggregatedLeaderboard = Object.values(teamMap)
      .sort(
        (a, b) =>
          b.totalScore - a.totalScore || a.totalTimePenalty - b.totalTimePenalty
      )
      .map((team, index) => ({
        rank: index + 1,
        ...team,
      }));

    // Return response including user attempts for frontend button control
    return res.json({
      id: round.id,
      roundNumber: round.roundNumber,
      name: round.name,
      duration: round.duration,
      startAt: round.startTime,
      endAt: round.endsAt,
      startTime: round.startTime,
      endsAt: round.endsAt,
      status: round.status,
      weight: round.weight,
      createdAt: round.createdAt,
      questions: round.Questions.map(q => ({
        id: q.id,
        title: q.title,
        problemStatement: q.problemStatement,
        createdAt: q.createdAt,
        testCases: q.TestCases,
        buggyCodes: q.BuggyCodes,
      })),
      leaderboard: aggregatedLeaderboard,
      userAttempts: userAttemptMap, // userId -> questionId -> {attempts, solved}
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};
