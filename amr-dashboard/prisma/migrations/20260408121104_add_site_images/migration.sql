/*
  Warnings:

  - You are about to drop the column `imageURL` on the `SiteData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SiteData" DROP COLUMN "imageURL";

-- CreateTable
CREATE TABLE "SiteImage" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siteId" INTEGER NOT NULL,

    CONSTRAINT "SiteImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SiteImage" ADD CONSTRAINT "SiteImage_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "SiteData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
