-- AlterTable
ALTER TABLE `UserPublishRoute` ADD COLUMN `avgAltitude` DOUBLE NULL,
    ADD COLUMN `avgSpeed` DOUBLE NULL,
    ADD COLUMN `downhillDistance` DOUBLE NULL,
    ADD COLUMN `elevation` DOUBLE NULL,
    ADD COLUMN `flatDistance` DOUBLE NULL,
    ADD COLUMN `maxAltitude` DOUBLE NULL,
    ADD COLUMN `uphillDistance` DOUBLE NULL;
