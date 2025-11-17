-- CreateTable
CREATE TABLE `UserPublishRoute` (
    `id` VARCHAR(191) NOT NULL,
    `createdTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `startName` VARCHAR(191) NOT NULL,
    `startCoord` VARCHAR(191) NOT NULL,
    `endName` VARCHAR(191) NOT NULL,
    `endCoord` VARCHAR(191) NOT NULL,
    `waypoints` JSON NULL,
    `distance` DOUBLE NOT NULL,
    `duration` VARCHAR(191) NOT NULL,
    `encodedPolyline` VARCHAR(191) NULL,
    `mainRoute` JSON NULL,
    `waypointRoutes` JSON NULL,
    `heatConsumption` DOUBLE NULL,
    `route` JSON NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserPublishRoute` ADD CONSTRAINT `UserPublishRoute_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
