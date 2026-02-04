import { Request, Response } from 'express';
import prisma from '../../prismaClient';

export const registerController = async (req: Request, res: Response) => {
  try {
    const { username, password, email, fullName, teamId } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'username and password are required' });

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });
    if (existing) return res.status(409).json({ message: 'User with that username/email already exists' });

    const user = await prisma.user.create({
      data: { username, password, email, fullName, teamId: teamId ? BigInt(teamId) : undefined }
    });

    return res.status(201).json({ message: 'User created', user: { id: user.id.toString(), username: user.username, fullName: user.fullName } });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Registration failed' });
  }
};