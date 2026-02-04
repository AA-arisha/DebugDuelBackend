import { Request, Response } from "express";
import prisma from "../../prismaClient";

export const updateTeam = async (req: Request, res: Response) => {
  try {
    const teamId = BigInt(req.params.id);

    const {
      teamName,
      leader,
      members = [],
      passwordOption,
      password,
    } = req.body;

    /* ---------------- BASIC VALIDATION ---------------- */

    if (!teamName || !leader?.name || !leader?.email) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const totalMembers = 1 + members.length;
    if (totalMembers < 1 || totalMembers > 3) {
      return res
        .status(400)
        .json({ message: "Team must have between 1 and 3 members" });
    }

    /* ---------------- PASSWORD RESOLUTION ---------------- */

    const finalPassword =
      passwordOption === "AUTO"
        ? Math.random().toString(36).slice(-8)
        : password;

    if (!finalPassword) {
      return res.status(400).json({ message: "Password required" });
    }

    /* ---------------- TEAM EXISTENCE ---------------- */

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    /* ---------------- TEAM NAME CONFLICT ---------------- */

    if (teamName !== team.name) {
      const existingTeam = await prisma.team.findUnique({
        where: { name: teamName },
      });

      if (existingTeam) {
        return res.status(409).json({ message: "Team name already exists" });
      }
    }

    /* ---------------- EMAIL VALIDATION ---------------- */

    const emails = [
      leader.email,
      ...members.map((m: any) => m.email),
    ].filter(Boolean);

    // Duplicate emails inside payload
    const duplicateEmails = emails.filter(
      (email, i) => emails.indexOf(email) !== i
    );

    if (duplicateEmails.length) {
      return res.status(400).json({
        message: "Duplicate emails are not allowed in a team",
      });
    }

    // Emails already used by OTHER teams
    const existingUsers = await prisma.user.findMany({
      where: {
        email: { in: emails },
        teamId: { not: teamId },
      },
    });

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "One or more emails already belong to another team",
      });
    }

    /* ---------------- TRANSACTION ---------------- */

    await prisma.$transaction(async (tx) => {
      // 1️⃣ Update team name
      await tx.team.update({
        where: { id: teamId },
        data: { name: teamName },
      });

      // 2️⃣ Delete all existing users for this team
      await tx.user.deleteMany({
        where: { teamId },
      });

      // 3️⃣ Recreate leader
      await tx.user.create({
        data: {
          username: teamName,
          fullName: leader.name,
          email: leader.email,
          password: finalPassword, // plaintext
          role: "PARTICIPANT",
          isLeader: true,
          teamId,
        },
      });

      // 4️⃣ Recreate members
      for (const member of members) {
        await tx.user.create({
          data: {
            fullName: member.name,
            email: member.email,
            password: finalPassword, // plaintext
            role: "PARTICIPANT",
            teamId,
          },
        });
      }
    });

    /* ---------------- RESPONSE ---------------- */

    res.json({
      message: "Team updated successfully",
      credentials: {
        teamName,
        password: finalPassword,
      },
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      message: "Failed to update team",
      error: err.message,
    });
  }
};
