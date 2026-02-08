// utils/roundTimers.ts
import { PrismaClient } from "@prisma/client";
import { emitRoundUpdate } from '../socket/emitRoundUpdate';
const prisma = new PrismaClient()
const activeTimers: Record<string, NodeJS.Timeout> = {};

export function scheduleRoundAutoComplete(
  key: string,
  roundId: bigint,
  endsAt: Date
) {
  if (activeTimers[key]) clearTimeout(activeTimers[key]);

  const delay = Math.max(0, endsAt.getTime() - Date.now());

  activeTimers[key] = setTimeout(async () => {
    const updated = await prisma.round.updateMany({
      where: { id: roundId, status: 'ACTIVE' },
      data: { status: 'COMPLETED' },
    });

    if (updated.count) {
      const round = await prisma.round.findUnique({ where: { id: roundId } });
      if (round) emitRoundUpdate(round);
    }

    delete activeTimers[key];
  }, delay);
}

export function cancelRoundTimer(key: string) {
  if (activeTimers[key]) {
    clearTimeout(activeTimers[key]);
    delete activeTimers[key];
  }
}
