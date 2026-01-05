import { PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';

const prisma = new PrismaClient()

export const getAllProblems = async (req: Request, res: Response) => {
  try {
    const problems = await prisma.problem.findMany({ include: { testcases: true } });
    res.json(problems);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


export const getProblemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if ID exists
    if (!id) {
      return res.status(400).json({ error: 'Problem ID is required' });
    }

    // Parse ID to number
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return res.status(400).json({ error: 'Problem ID must be a number' });
    }

    // Fetch problem from Prisma
    const problem = await prisma.problem.findUnique({
      where: { id: numericId },
      include: { testcases: true },
    });

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json(problem);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

