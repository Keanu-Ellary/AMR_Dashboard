import type { RiverSegment } from "@/types/map_types";

export const RIVER_SEGMENTS: RiverSegment[] = [
  {
    id: "seg1",
    from: "Site A",
    to: "Site B",
    risk: "moderate",
    path: [
      [-25.75, 28.20],
      [-25.76, 28.22],
      [-25.77, 28.24]
    ]
  },
  {
    id: "seg2",
    from: "Site B",
    to: "Site C",
    risk: "high",
    path: [
      [-25.77, 28.24],
      [-25.78, 28.26]
    ]
  }
];
