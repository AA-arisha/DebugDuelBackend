import {Router, Response , Request} from 'express'
import prisma from '../../prismaClient';
export const getAllTeams = async (req: Request, res: Response) => {
  const teams = await prisma.team.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      members: {
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          password : true,
          isLeader: true,
          emailStatus: true,
          createdAt: true
        }
      }
    }
  });
 const teamPlain = JSON.parse(
  JSON.stringify(teams, (key, value) => (typeof value === 'bigint' ? value.toString() : value))
);

// console.log(teamPlain);
  res.json(teams);
};
