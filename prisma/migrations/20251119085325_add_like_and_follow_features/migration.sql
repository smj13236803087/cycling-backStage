-- AlterTable
ALTER TABLE `User` ADD COLUMN `followersCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `followingCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `likesReceivedCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `UserPublishRoute` ADD COLUMN `likeCount` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `UserFollow` (
    `id` VARCHAR(191) NOT NULL,
    `followerId` VARCHAR(191) NOT NULL,
    `followingId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserFollow_followerId_idx`(`followerId`),
    INDEX `UserFollow_followingId_idx`(`followingId`),
    UNIQUE INDEX `UserFollow_followerId_followingId_key`(`followerId`, `followingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RouteLike` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `routeId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RouteLike_userId_idx`(`userId`),
    INDEX `RouteLike_routeId_idx`(`routeId`),
    UNIQUE INDEX `RouteLike_userId_routeId_key`(`userId`, `routeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserFollow` ADD CONSTRAINT `UserFollow_followerId_fkey` FOREIGN KEY (`followerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserFollow` ADD CONSTRAINT `UserFollow_followingId_fkey` FOREIGN KEY (`followingId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RouteLike` ADD CONSTRAINT `RouteLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RouteLike` ADD CONSTRAINT `RouteLike_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `UserPublishRoute`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
