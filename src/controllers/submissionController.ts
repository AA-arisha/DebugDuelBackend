import { Request, Response } from 'express';
import { PrismaClient, Submission, Leaderboard } from '@prisma/client';

const prisma = new PrismaClient();

import { executeCode, normalizeOutput, fetchRuntimeVersion } from '../utils/piston';

interface SubmitCodeBody {
  code: string;
  language: string;
  questionId: string | number;
  userId: string | number;
}

export const submitCode = async (req: Request<{}, {}, SubmitCodeBody>, res: Response) => {
  try {
    const { code, language, questionId, userId } = req.body;

    if (!code || !language || !questionId || !userId) {
      return res.status(400).json({ message: 'code, language, questionId, and userId are required' });
    }

    const question = await prisma.question.findUnique({
      where: { id: BigInt(questionId) },
      include: { TestCases: true, round: true }
    });

    if (!question) return res.status(404).json({ message: 'Question not found' });
    if (!question.TestCases || question.TestCases.length === 0)
      return res.status(400).json({ message: 'No test cases available for this question' });

    const round = question.round;
    if (!round.startTime) return res.status(400).json({ message: 'Round has not started yet' });

    const timeTakenSeconds = Math.floor((Date.now() - new Date(round.startTime).getTime()) / 1000);

    // Fetch runtime version
    const version = await fetchRuntimeVersion(language);
    if (!version) return res.status(400).json({ message: `Runtime for ${language} not available` });

    // Run test cases
    const totalTests = question.TestCases.length;
    let passedTests = 0;

    for (let i = 0; i < totalTests; i++) {
      const testCase = question.TestCases[i];
      const result = await executeCode(code, language, testCase.input, version);

      if (result.run.code !== 0) {
        return res.status(200).json({
          success: false,
          failedTest: i + 1,
          totalTests,
          passedTests,
          error: 'Runtime Error',
          stderr: result.run.stderr,
          testCaseDescription: testCase.description
        });
      }

      const actualOutput = normalizeOutput(result.run.stdout);
      const expectedOutput = normalizeOutput(testCase.expectedOutput);

      if (actualOutput !== expectedOutput) {
        return res.status(200).json({
          success: false,
          failedTest: i + 1,
          totalTests,
          passedTests,
          expected: expectedOutput,
          actual: actualOutput,
          input: testCase.input,
          testCaseDescription: testCase.description
        });
      }

      passedTests++;
    }

    // Calculate scoring rules
    const questionsInRound = await prisma.question.count({ where: { roundId: round.id } });
    const maxScore = questionsInRound > 0 ? Math.round(((round.weight ?? 0) / questionsInRound)) : 0;

    // Ensure userQuestion tracking exists
    let userQuestion = await prisma.userQuestion.findUnique({
      where: { userId_questionId: { userId: BigInt(userId), questionId: question.id } }
    });

    if (!userQuestion) {
      userQuestion = await prisma.userQuestion.create({ data: { userId: BigInt(userId), questionId: question.id } });
    }

    if (userQuestion.disabled) return res.status(400).json({ message: 'Question already solved/disabled for this user' });
    if (userQuestion.attempts >= 3) return res.status(400).json({ message: 'Maximum attempts reached for this question' });

    const prevAttempts = userQuestion.attempts;
    const attemptNumber = prevAttempts + 1;

    let earnedScore = 0;
    if (passedTests === totalTests) {
      const deductionFactor = Math.min(prevAttempts / 3, 1);
      earnedScore = Math.max(0, Math.round(maxScore * (1 - deductionFactor)));
    }

    // --- Atomic transaction ---
    const [submission, leaderboard]: [Submission, Leaderboard] = await prisma.$transaction(async (tx) => {
      const isCorrect = passedTests === totalTests;

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
          isCorrect
        }
      });

      await tx.userQuestion.update({
        where: { userId_questionId: { userId: BigInt(userId), questionId: question.id } },
        data: { attempts: attemptNumber, disabled: isCorrect }
      });

      let lb = await tx.leaderboard.findUnique({
        where: { roundId_userId: { roundId: round.id, userId: BigInt(userId) } }
      });

      if (!lb) {
        lb = await tx.leaderboard.create({
          data: {
            userId: BigInt(userId),
            roundId: round.id,
            score: isCorrect ? earnedScore : 0,
            timePenalty: isCorrect ? timeTakenSeconds : 0,
            correctCount: isCorrect ? 1 : 0,
            wrongCount: isCorrect ? 0 : 1
          }
        });
      } else {
        lb = await tx.leaderboard.update({
          where: { id: lb.id },
          data: {
            score: isCorrect ? lb.score + earnedScore : lb.score,
            timePenalty: isCorrect ? lb.timePenalty + timeTakenSeconds : lb.timePenalty,
            correctCount: isCorrect ? lb.correctCount + 1 : lb.correctCount,
            wrongCount: isCorrect ? lb.wrongCount : lb.wrongCount + 1
          }
        });
      }

      // Recalculate ranks for the round (rebuild full order)
      const allLbs = await tx.leaderboard.findMany({ where: { roundId: round.id }, orderBy: [{ score: 'desc' }, { timePenalty: 'asc' }] });
      for (let i = 0; i < allLbs.length; i++) {
        await tx.leaderboard.update({ where: { id: allLbs[i].id }, data: { rank: i + 1 } });
      }

      // Update user's overall totalScore if correct
      if (isCorrect && earnedScore > 0) {
        await tx.user.update({ where: { id: BigInt(userId) }, data: { totalScore: { increment: earnedScore } } });
      }

      return [sub, lb];
    });

    return res.status(200).json({
      success: true,
      submission,
      leaderboard,
      message: 'All test cases passed! Submission saved and leaderboard updated atomically.'
    });
  } catch (error: any) {
    console.error('Submission error:', error);
    return res.status(500).json({ message: 'Submission failed', error: error?.message || String(error) });
  }
};
