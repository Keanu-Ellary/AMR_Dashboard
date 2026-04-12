/*
  Warnings:

  - Made the column `dangerZone` on table `SiteData` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SiteData" ALTER COLUMN "dangerZone" SET NOT NULL;
