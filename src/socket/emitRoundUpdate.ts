// socket/emitRoundUpdate.ts
import { getIO } from '../socket';

export function emitRoundUpdate(round: any) {
  const io = getIO();

  // Normalize payload for frontend compatibility:
  // - stringify BigInt ids
  // - provide both REST-like fields (`startAt`/`endAt`) and raw DB fields
  const payload = {
    ...round,
    id: round.id?.toString(),
    // normalize time fields - prefer existing names but expose both forms
    startAt: round.startTime ?? round.startAt ?? null,
    endAt: round.endsAt ?? round.endAt ?? null,
    startTime: round.startTime ?? null,
    endsAt: round.endsAt ?? null,
  };

  io.to(`round_${payload.id}`).emit('round_updated', payload);
  io.to('competition_overall').emit('round_updated', payload);
}
