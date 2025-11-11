/*
  Warnings:

  - You are about to drop the column `passwordHash` on the `PendingUser` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - Added the required column `password` to the `PendingUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `PendingUser` DROP COLUMN `passwordHash`,
    ADD COLUMN `password` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `passwordHash`,
    ADD COLUMN `password` VARCHAR(191) NULL;
