import { prisma } from "../../lib/db";
import { adminNeeded } from "../../lib/middleware/authMiddleware";
import { minioClient, BUCKET } from "../../lib/minio";
import { logChange } from "../changelog/changeLog";
import { parseLocationName } from "../../utils/siteUtils";

interface BulkDeleteFilters {
  all?: boolean;
  locations?: string[];
  ids?: number[];
  startDate?: string;
  endDate?: string;
}

export async function deleteSitesBulk(token: string, filters: BulkDeleteFilters) {
  const authorize = adminNeeded(token);

  if (!authorize.authorized) {
    return {
      statusCode: authorize.statusCode,
      body: { error: authorize.message },
    };
  }

  try {
    // 1. Construct where conditions
    const where: any = {};

    if (filters.ids && filters.ids.length > 0) {
      where.id = { in: filters.ids };
    } else if (filters.startDate || filters.endDate) {
      where.collectionDate = {};
      if (filters.startDate) {
        where.collectionDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.collectionDate.lte = new Date(filters.endDate);
      }
    }

    // Fetch candidate records
    let sites = await prisma.siteData.findMany({
      where,
      include: { images: true },
    });

    // Filter by location names if specified
    if (filters.locations && filters.locations.length > 0) {
      sites = sites.filter((site) =>
        filters.locations!.includes(parseLocationName(site.geoLocName))
      );
    }

    if (sites.length === 0) {
      return {
        statusCode: 200,
        body: { message: "No matching records found to delete", count: 0 },
      };
    }

    // 2. Perform deletion and image cleanup
    const deletedIds: number[] = [];
    const minioObjectNames: string[] = [];

    sites.forEach((site) => {
      if (site.id) {
        deletedIds.push(site.id);
      }
      site.images.forEach((img) => {
        const parts = img.url.split("/");
        minioObjectNames.push(parts[parts.length - 1]);
      });
    });

    // Delete images from MinIO bucket
    if (minioObjectNames.length > 0) {
      try {
        await minioClient.removeObjects(BUCKET, minioObjectNames);
      } catch (err) {
        console.error("MinIO image removal failed:", err);
      }
    }

    // Delete records from database
    await prisma.siteData.deleteMany({
      where: { id: { in: deletedIds } },
    });

    // 3. Log grouped bulk deletion in change log
    await logChange(
      "SiteData",
      0,
      "BULK_DELETE",
      sites,
      null,
      authorize.user!.userId
    );

    return {
      statusCode: 200,
      body: {
        message: `Successfully deleted ${sites.length} record(s)`,
        count: sites.length,
      },
    };
  } catch (error) {
    console.error("Bulk deletion failed:", error);
    return {
      statusCode: 500,
      body: { error: "Failed to perform bulk deletion" },
    };
  }
}
