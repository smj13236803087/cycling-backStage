-- AlterTable
ALTER TABLE `RideRecordRoute` ADD COLUMN `stravaActivityId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `RideStatistics` ADD COLUMN `stravaActivityId` VARCHAR(191) NULL;
