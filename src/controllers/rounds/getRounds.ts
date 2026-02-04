import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Get all rounds
 * Optional: include questions and submissions
 */
export const getAllRounds = async (req: Request, res: Response) => {
  try {
    const rounds = await prisma.round.findMany({
      orderBy: { roundNumber: 'asc' },
      include: {
        Questions: {
          include: { TestCases: true, BuggyCodes: true },
        },
        Submissions: {
          include: { user: true, question: true }, // participant & question info
        },
        Leaderboards: {
          include: { user: true }, // participant info
          orderBy: { rank: 'asc' },
        },
      },
    });

    // map to frontend-friendly shape
    const mapped = rounds.map(r => ({
      id: r.id,
      name: r.name,
      status: r.status,
      duration: r.duration,
      roundNumber: r.roundNumber,
      startAt: r.startTime,
      endAt: r.endsAt,
      weight: r.weight
    }));

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rounds for admin' });
  }
};
