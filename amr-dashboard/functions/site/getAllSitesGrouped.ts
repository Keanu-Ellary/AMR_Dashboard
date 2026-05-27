import { prisma } from "../../lib/db";

export async function getAllSitesGrouped() {
    try {
        const sites = await prisma.siteData.findMany({
            select: {
                id: true,
                dangerZone: true,

                sampleName: true,
                isolationSource: true,
                collectionDate: true,
                geoLocName: true,
                latitude: true,
                longitude: true,
                amrResGenes: true,
                predictedSir: true,
                sampleAnalysisType: true,

                organism: true,
                isolateId: true,
                sampleId: true,
                collectedBy: true,
                class: true,
                subclass: true,
                accession: true,
                virtulenceGenes: true,
                plasmidReplicons: true,

                temperature: true,
                tds: true,
                ph: true,
                dissolvedO2: true,
                ec: true,
                createdAt: true,
                images: {
                    select: {
                        url: true,
                    },
                },
            },
        });

        // Group by location: use geoLocName if available, otherwise fall back to lat,lng
        const locationMap = new Map<
            string,
            {
                location: string;
                latitude: number;
                longitude: number;
                samples: typeof sites;
            }
        >();

        for (const site of sites) {
            const key = site.geoLocName || `${site.latitude},${site.longitude}`;

            if (!locationMap.has(key)) {
                locationMap.set(key, {
                    location: key,
                    latitude: site.latitude,
                    longitude: site.longitude,
                    samples: [],
                });
            }

            locationMap.get(key)!.samples.push(site);
        }

        // For each location group, deduplicate by organism (keep most recent per organism)
        const groups = Array.from(locationMap.values()).map((group) => {
            const totalSamples = group.samples.length;

            // Group samples by organism
            const organismMap = new Map<string, (typeof sites)[number]>();

            for (const sample of group.samples) {
                const organismKey = sample.organism?.trim() || "Unknown";

                const existing = organismMap.get(organismKey);
                if (
                    !existing ||
                    new Date(sample.collectionDate).getTime() >
                        new Date(existing.collectionDate).getTime()
                ) {
                    organismMap.set(organismKey, sample);
                }
            }

            const isolates = Array.from(organismMap.values());

            // Latest danger zone: from the most recent sample at this location
            const sortedByDate = [...group.samples].sort(
                (a, b) =>
                    new Date(b.collectionDate).getTime() -
                    new Date(a.collectionDate).getTime()
            );
            const latestDangerZone = sortedByDate[0]?.dangerZone ?? "unknown";

            return {
                location: group.location,
                latitude: group.latitude,
                longitude: group.longitude,
                latestDangerZone,
                totalSamples,
                isolates,
            };
        });

        return {
            statusCode: 200,
            body: { groups },
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            body: { error: "Failed to fetch grouped sites" },
        };
    }
}
