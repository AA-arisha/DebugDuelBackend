// utils/teamNameResolver.ts
import prisma from '../prismaClient';

/**
 * Resolves a team name. If the name already exists, appends _1, _2, etc.
 */
export const resolveTeamName = async (baseName: string): Promise<string> => {
  let name = baseName;
  let counter = 1;

  while (await prisma.team.findUnique({ where: { name } })) {
    name = `${baseName}_${counter++}`;
  }

  return name;
};
