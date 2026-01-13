/*
  Warnings:

  - You are about to drop the column `teamId` on the `EmailLog` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `Leaderboard` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Team` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[roundId,userId]` on the table `Leaderboard` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `EmailLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Leaderboard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "EmailLog" DROP CONSTRAINT "EmailLog_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Leaderboard" DROP CONSTRAINT "Leaderboard_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_teamId_fkey";

-- DropIndex
DROP INDEX "Leaderboard_roundId_teamId_key";

-- AlterTable
ALTER TABLE "EmailLog" DROP COLUMN "teamId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Leaderboard" DROP COLUMN "teamId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "teamId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- DropTable
DROP TABLE "Admin";

-- DropTable
DROP TABLE "Team";

-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_roundId_userId_key" ON "Leaderboard"("roundId", "userId");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leaderboard" ADD CONSTRAINT "Leaderboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
