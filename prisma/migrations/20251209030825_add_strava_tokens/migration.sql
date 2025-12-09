-- AlterTable
ALTER TABLE `User` ADD COLUMN `stravaAccessToken` VARCHAR(191) NULL,
    ADD COLUMN `stravaAthleteId` VARCHAR(191) NULL,
    ADD COLUMN `stravaRefreshToken` VARCHAR(191) NULL,
    ADD COLUMN `stravaTokenExpiresAt` DATETIME(3) NULL;
