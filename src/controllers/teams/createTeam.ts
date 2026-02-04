import { Request, Response } from "express";
import prisma from "../../prismaClient";

type MemberInput = {
  name: string;
  email: string;
};

type LeaderInput = {
  name: string;
  email: string;
};

type CreateTeamBody = {
  teamName: string;
  leader: LeaderInput;
  members?: MemberInput[];
  passwordOption: "AUTO" | "MANUAL";
  password?: string;
};

export const createTeam = async (
  req: Request<{}, {}, CreateTeamBody>,
  res: Response
) => {
  const { teamName, leader, members = [], passwordOption, password } = req.body;

  const totalMembers = 1 + members.length;
  if (totalMembers < 1 || totalMembers > 3) {
    return res.status(400).json({
      message: "Team must have between 1 and 3 members",
    });
  }

  const finalPassword =
    passwordOption === "AUTO"
      ? Math.random().toString(36).slice(-8)
      : password;

  if (!finalPassword) {
    return res.status(400).json({ message: "Password required" });
  }

  try {
    const team = await prisma.$transaction(async (tx) => {
      /* 1️⃣ Ensure unique team name */
      let finalTeamName = teamName;
      let counter = 1;

      while (
        await tx.team.findUnique({ where: { name: finalTeamName } })
      ) {
        finalTeamName = `${teamName} ${counter}`;
        counter++;
      }

      /* 2️⃣ Create Team */
      const createdTeam = await tx.team.create({
        data: {
          name: finalTeamName,
        },
      });

      /* 3️⃣ Ensure leader email is unique */
      const existingLeader = await tx.user.findUnique({
        where: { email: leader.email },
      });

      if (existingLeader) {
        throw new Error(`Leader email "${leader.email}" already exists`);
      }

      /* 4️⃣ Create Leader (password stored as PLAINTEXT) */
      await tx.user.create({
        data: {
          fullName: leader.name,
          email: leader.email,
          username: finalTeamName,
          password: finalPassword, // ⚠️ plaintext as requested
          role: "PARTICIPANT",
          isLeader: true,
          teamId: createdTeam.id,
        },
      });

      /* 5️⃣ Create Members */
      const validMembers = members.filter(
        (m) => m.name?.trim() && m.email?.trim()
      );

      for (const member of validMembers) {
        const existingMember = await tx.user.findUnique({
          where: { email: member.email },
        });

        if (existingMember) {
          throw new Error(`Member email "${member.email}" already exists`);
        }

        await tx.user.create({
          data: {
            fullName: member.name,
            email: member.email,
            password: finalPassword, // same team password
            role: "PARTICIPANT",
            teamId: createdTeam.id,
          },
        });
      }

      return createdTeam;
    });

    res.status(201).json({
      message: "Team created successfully",
      credentials: {
        teamName: team.name,
        password: finalPassword,
      },
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      message: "Failed to create team",
      error: err.message,
    });
  }
};
