import { Router, Response, Request } from "express";
import prisma from "../prismaClient";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const loginController = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if ((!username && !email) || !password) {
    return res.status(401).json({ message: "Username/email and password required" });
  }

  try {
    // Search user by email or username (case-insensitive for username)
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    } else {
      const userName = (username as string).toLowerCase();
      user = await prisma.user.findFirst({ where: { username: { equals: userName, mode: 'insensitive' } } });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid username" });
    }

    // Plain-text password comparison
    if (password !== user.password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        userId: user.id.toString(),
        username: user.username,
        userRole: user.role.toUpperCase() as "ADMIN" | "PARTICIPANT",
      },
      process.env.jwt_secret as string,
      { expiresIn: "4h" }
    );

    // return token and user object for frontend
    const userPayload = {
      id: user.id.toString(),
      username: user.username,
      name: user.fullName,
      role: user.role,
      teamId: user.teamId ? user.teamId.toString() : undefined,
      totalScore: (user as any).totalScore ?? 0
    };

    return res.json({ token, user: userPayload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
