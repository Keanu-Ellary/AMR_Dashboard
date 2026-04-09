-- DropForeignKey
ALTER TABLE "SiteImage" DROP CONSTRAINT "SiteImage_siteId_fkey";

-- AddForeignKey
ALTER TABLE "SiteImage" ADD CONSTRAINT "SiteImage_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "SiteData"("id") ON DELETE CASCADE ON UPDATE CASCADE;
