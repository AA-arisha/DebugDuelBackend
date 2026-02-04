/*
  Warnings:

  - The `status` column on the `Round` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `isHidden` on the `TestCase` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('LOCKED', 'UNLOCKED', 'ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "endsAt" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "RoundStatus" NOT NULL DEFAULT 'LOCKED',
ALTER COLUMN "weight" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TestCase" DROP COLUMN "isHidden",
ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true;
