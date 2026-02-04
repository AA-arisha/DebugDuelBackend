import {Router, Response , Request} from 'express'
import prisma from '../../prismaClient';

export const deleteTeam = async (req: Request, res: Response) => {
  const teamId = BigInt(req.params.id);

  await prisma.team.delete({
    where: { id: teamId }
  });

  res.json({ message: 'Team deleted successfully' });
};
