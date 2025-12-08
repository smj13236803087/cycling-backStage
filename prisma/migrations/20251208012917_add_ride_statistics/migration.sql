-- CreateTable
CREATE TABLE `RideStatistics` (
    `id` VARCHAR(191) NOT NULL,
    `startCoordinate` VARCHAR(191) NOT NULL,
    `endCoordinate` VARCHAR(191) NOT NULL,
    `startAddress` VARCHAR(191) NOT NULL,
    `endAddress` VARCHAR(191) NOT NULL,
    `createdTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `distance` DOUBLE NOT NULL,
    `duration` DOUBLE NOT NULL,
    `elevation` DOUBLE NULL,
    `avgSpeed` DOUBLE NULL,
    `route` JSON NULL,
    `uphillDistance` DOUBLE NULL,
    `downhillDistance` DOUBLE NULL,
    `flatDistance` DOUBLE NULL,
    `avgAltitude` DOUBLE NULL,
    `maxAltitude` DOUBLE NULL,
    `heatConsumption` DOUBLE NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RideStatistics` ADD CONSTRAINT `RideStatistics_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
