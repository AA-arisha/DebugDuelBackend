import { Request, Response } from 'express';
import prisma from '../../prismaClient';
import { AuthenticatedRequest } from '../../middlewares/authenticateUser';

export const meController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const user = await prisma.user.findUnique({ where: { id: BigInt(userId) }, include: { team: true } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      id: user.id.toString(),
      username: user.username,
      name: user.fullName,
      role: user.role,
      team: user.team ? { id: user.team.id.toString(), name: user.team.name } : null,
      totalScore: (user as any).totalScore ?? 0
    });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ message: 'Failed to fetch user' });
  }
};