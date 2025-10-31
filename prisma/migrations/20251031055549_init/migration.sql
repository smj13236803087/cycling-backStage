/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `age` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` DROP PRIMARY KEY,
    ADD COLUMN `age` INTEGER NOT NULL,
    ADD COLUMN `avatar` VARCHAR(191) NULL,
    ADD COLUMN `password` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- CreateTable
CREATE TABLE `RideRecordRoute` (
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
    `route` JSON NOT NULL,
    `uphillDistance` DOUBLE NULL,
    `downhillDistance` DOUBLE NULL,
    `flatDistance` DOUBLE NULL,
    `avgAltitude` DOUBLE NULL,
    `maxAltitude` DOUBLE NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ManualCreatedRoute` (
    `id` VARCHAR(191) NOT NULL,
    `createdTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `startName` VARCHAR(191) NOT NULL,
    `startCoord` VARCHAR(191) NOT NULL,
    `endName` VARCHAR(191) NOT NULL,
    `endCoord` VARCHAR(191) NOT NULL,
    `waypoints` JSON NULL,
    `distance` DOUBLE NOT NULL,
    `duration` DOUBLE NOT NULL,
    `encodedPolyline` VARCHAR(191) NULL,
    `mainRoute` JSON NULL,
    `waypointRoutes` JSON NULL,
    `heatConsumption` DOUBLE NULL,
    `route` JSON NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RideRecordRoute` ADD CONSTRAINT `RideRecordRoute_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManualCreatedRoute` ADD CONSTRAINT `ManualCreatedRoute_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
