import {Router, Response , Request} from 'express'
import prisma from '../../prismaClient';

export const getTeamById = async (req: Request, res: Response) => {
  const teamId = BigInt(req.params.id);

  const team = await prisma.team.findUnique({
  where: { id: teamId },
  include: {
    members: {
      orderBy: { isLeader: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        password: true,
        isLeader: true,
        createdAt: true,
      },
    },
  },
});


  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }
 const teamPlain = JSON.parse(
  JSON.stringify(team, (key, value) => (typeof value === 'bigint' ? value.toString() : value))
);

console.log(teamPlain);
  res.json(team);
};
