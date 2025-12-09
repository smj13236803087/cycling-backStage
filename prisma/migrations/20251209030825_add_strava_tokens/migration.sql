ALTER TABLE `User`
ADD COLUMN `stravaAccessToken` VARCHAR(191),
ADD COLUMN `stravaAthleteId` VARCHAR(191),
ADD COLUMN `stravaRefreshToken` VARCHAR(191),
ADD COLUMN `stravaTokenExpiresAt` DATETIME(3);

