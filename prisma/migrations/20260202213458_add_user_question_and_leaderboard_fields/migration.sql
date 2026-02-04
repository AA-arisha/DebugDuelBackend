-- AlterTable
ALTER TABLE "Leaderboard" ADD COLUMN     "correctCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wrongCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "attemptNumber" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "totalScore" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserQuestion" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "questionId" BIGINT NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserQuestion_userId_questionId_key" ON "UserQuestion"("userId", "questionId");

-- AddForeignKey
ALTER TABLE "UserQuestion" ADD CONSTRAINT "UserQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestion" ADD CONSTRAINT "UserQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
