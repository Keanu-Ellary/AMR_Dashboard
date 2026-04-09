/*
  Warnings:

  - Added the required column `amrResGenes` to the `SiteData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `collectionDate` to the `SiteData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `geoLocName` to the `SiteData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isolationSource` to the `SiteData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `predictedSir` to the `SiteData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sampleAnalysisType` to the `SiteData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sampleName` to the `SiteData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SiteData" ADD COLUMN     "accession" TEXT,
ADD COLUMN     "alignmentLength" DOUBLE PRECISION,
ADD COLUMN     "amrResGenes" TEXT NOT NULL,
ADD COLUMN     "class" TEXT,
ADD COLUMN     "collectedBy" TEXT,
ADD COLUMN     "collectionDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "coverage" DOUBLE PRECISION,
ADD COLUMN     "elementType" TEXT,
ADD COLUMN     "geoLocName" TEXT NOT NULL,
ADD COLUMN     "identity" DOUBLE PRECISION,
ADD COLUMN     "isolateId" TEXT,
ADD COLUMN     "isolationSource" TEXT NOT NULL,
ADD COLUMN     "organism" TEXT,
ADD COLUMN     "plasmidReplicons" TEXT,
ADD COLUMN     "predictedSir" TEXT NOT NULL,
ADD COLUMN     "referenceLength" DOUBLE PRECISION,
ADD COLUMN     "sampleAnalysisType" TEXT NOT NULL,
ADD COLUMN     "sampleId" TEXT,
ADD COLUMN     "sampleName" TEXT NOT NULL,
ADD COLUMN     "sequenceName" TEXT,
ADD COLUMN     "subclass" TEXT,
ADD COLUMN     "targetLength" DOUBLE PRECISION,
ADD COLUMN     "virtulenceGenes" TEXT,
ALTER COLUMN "dangerZone" DROP NOT NULL,
ALTER COLUMN "temperature" DROP NOT NULL,
ALTER COLUMN "ph" DROP NOT NULL,
ALTER COLUMN "tds" DROP NOT NULL,
ALTER COLUMN "ec" DROP NOT NULL,
ALTER COLUMN "dissolvedO2" DROP NOT NULL;
