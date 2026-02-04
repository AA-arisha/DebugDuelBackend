// controllers/team/downloadTeams.ts
import { Request, Response } from "express";
import prisma from "../../prismaClient";

export const downloadTeams = async (req: Request, res: Response) => {
  try {
    // Fetch all teams with members
    const teams = await prisma.team.findMany({
      include: {
        members: {
          select: { fullName: true, email: true, password: true, isLeader: true },
        },
      },
    });

    // Transform data for CSV / PDF
    const csvData = teams.map((team) => {
      // Find leader
      const leader = team.members.find((m) => m.isLeader);
      return {
        teamName: team.name,
        leaderName: leader?.fullName || "N/A",
        leaderEmail: leader?.email || "N/A",
        leaderPassword: leader?.password || "N/A",
      };
    });

    res.json(csvData);
  } catch (err: any) {
    console.error("❌ Failed to fetch teams:", err);
    res.status(500).json({ message: "Failed to fetch teams", error: err.message });
  }
};
