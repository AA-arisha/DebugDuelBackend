import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { log } from 'console';
const prisma = new PrismaClient();

export const createRound = async (req: Request, res: Response) => {
  const { roundNumber, name, duration, weight } = req.body;
  console.log("hello");
  
  try {
    const round = await prisma.round.create({
      data: { roundNumber, name, duration, weight, status: 'LOCKED' },
    });
    res.status(201).json(round);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create round' });
  }
};
