import { PrismaClient, Round } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Auto-completes a round if its duration is over
 */
export const checkAutoComplete = async (round: Round): Promise<Round> => {
  if (round.status === 'ACTIVE' && round.startTime && round.duration) {
    const endTime = new Date(round.startTime.getTime() + round.duration * 60 * 1000);
    if (new Date() >= endTime) {
      return prisma.round.update({
        where: { id: round.id },
        data: { status: 'COMPLETED' },
      });
    }
  }
  return round;
};

/**
 * Round is editable if it's LOCKED or UNLOCKED
 */
export const isEditable = (round: Round): boolean => {
  return round.status === 'LOCKED' || round.status === 'UNLOCKED';
};

/**
 * Round is active if status === 'ACTIVE'
 */
export const isActive = (round: Round): boolean => {
  return round.status === 'ACTIVE';
};
