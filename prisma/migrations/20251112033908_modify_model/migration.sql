/*
  Warnings:

  - You are about to alter the column `duration` on the `ManualCreatedRoute` table. The data in that column could be lost. The data in that column will be cast from `Double` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `ManualCreatedRoute` MODIFY `duration` VARCHAR(191) NOT NULL;
