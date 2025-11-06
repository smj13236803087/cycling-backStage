/*
  Warnings:

  - You are about to alter the column `height` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `height` DOUBLE NULL;
