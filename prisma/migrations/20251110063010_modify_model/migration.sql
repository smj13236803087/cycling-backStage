/*
  Warnings:

  - Added the required column `displayName` to the `PendingUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `PendingUser` ADD COLUMN `displayName` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `age` INTEGER NULL;
