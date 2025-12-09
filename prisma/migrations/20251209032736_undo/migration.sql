/*
  Warnings:

  - You are about to drop the column `stravaAccessToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stravaAthleteId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stravaRefreshToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stravaTokenExpiresAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `stravaAccessToken`,
    DROP COLUMN `stravaAthleteId`,
    DROP COLUMN `stravaRefreshToken`,
    DROP COLUMN `stravaTokenExpiresAt`;
