-- AlterTable
ALTER TABLE "SiteImage" ADD COLUMN     "batchId" INTEGER;

-- CreateTable
CREATE TABLE "SiteImageBatch" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "dateTaken" TIMESTAMP(3) NOT NULL,
    "algaeDetected" BOOLEAN NOT NULL DEFAULT false,
    "algaeScanRun" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteImageBatch_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SiteImageBatch" ADD CONSTRAINT "SiteImageBatch_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "SiteData"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteImage" ADD CONSTRAINT "SiteImage_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "SiteImageBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
