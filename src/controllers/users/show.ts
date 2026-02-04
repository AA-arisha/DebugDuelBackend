import { Request, Response } from 'express';
import prisma from '../../prismaClient';

export const show = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: BigInt(id) }, include: { team: true } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ id: user.id.toString(), username: user.username, name: user.fullName, role: user.role, team: user.team ? { id: user.team.id.toString(), name: user.team.name } : null, totalScore: (user as any).totalScore ?? 0 });
  } catch (err) {
    console.error('Get user error', err);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};