import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const deleteRound = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Check if round exists
    const round = await prisma.round.findUnique({
      where: { id: BigInt(id) },
    });

    if (!round) {
      return res.status(404).json({ error: "Round not found" });
    }

    // Delete the round
    await prisma.round.delete({
      where: { id: BigInt(id) },
    });

    res.json({ message: "Round deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete round" });
  }
};
