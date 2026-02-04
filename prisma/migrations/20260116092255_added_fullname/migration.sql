-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fullName" TEXT,
ALTER COLUMN "username" DROP NOT NULL;
