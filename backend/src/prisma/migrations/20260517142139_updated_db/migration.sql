/*
  Warnings:

  - You are about to drop the column `updateAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `WorkoutId` on the `WorkoutEntry` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workoutId` to the `WorkoutEntry` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "WorkoutEntry" DROP CONSTRAINT "WorkoutEntry_WorkoutId_fkey";

-- DropIndex
DROP INDEX "WorkoutEntry_WorkoutId_idx";

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "tracksTime" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "WorkoutEntry" DROP COLUMN "WorkoutId",
ADD COLUMN     "workoutId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "WorkoutEntry_workoutId_idx" ON "WorkoutEntry"("workoutId");

-- AddForeignKey
ALTER TABLE "WorkoutEntry" ADD CONSTRAINT "WorkoutEntry_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
