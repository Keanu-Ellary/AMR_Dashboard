/*
  Warnings:

  - You are about to drop the column `algaeScanRun` on the `SiteImageBatch` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SiteImageBatch" DROP COLUMN "algaeScanRun",
ADD COLUMN     "aiScanRun" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pollutionDetected" BOOLEAN NOT NULL DEFAULT false;
