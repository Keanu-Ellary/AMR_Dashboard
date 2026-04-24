"use client";

import type { SiteData } from "@/types/site_types";
import { RISK_COLOUR, CONTAMINATION_LEVEL_ORDER } from "@/constants/map_constants";
import {  DangerZone, getDangerZoneLabel } from "@/types/map_types";
import { Trash2Icon } from "lucide-react";
import { deleteSite } from "@/app/services/siteService";
import { toast } from "react-toastify";
import ConfirmDelete from "../add-data/confirmDelete";
import { useEffect, useState } from "react";
import { getMe } from "@/app/services/authService";
import { unique } from "next/dist/build/utils";


interface SiteListProps {
  points: SiteData[];
  selectedSite: SiteData | null;
  onSelectSite: (site: SiteData) => void;
}

export default function SiteList({ points, selectedSite, onSelectSite }: SiteListProps) {

  const [siteToDelete, setSiteToDelete] = useState<SiteData | null>(null);
  const getDanger = (zone?: DangerZone)=> zone ? getDangerZoneLabel(zone) : "unknown";

  const uniqueSites = Object.values(
    points.reduce<Record<string, SiteData>>((uniquePoints, point ) => {
      const coords = `${point.latitude}, ${point.longitude}`;
      const uniquePoint = uniquePoints[coords];
      if (!uniquePoint || new Date(point.collectionDate) > new Date(uniquePoint.collectionDate)) {
        uniquePoints[coords] = point;
      }
      return uniquePoints;
    }, {} as Record<string, SiteData>)
  );

  const sortedPoints = [...uniqueSites].sort(
    (pointA, pointB) => (CONTAMINATION_LEVEL_ORDER[getDanger(pointA.dangerZone)] ?? 3) - (CONTAMINATION_LEVEL_ORDER[getDanger(pointB.dangerZone)] ?? 3)
  );
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    isAdmin();
  },[]);

  useEffect(() => {
  }, [isAdminUser]);

  const isAdmin = async () => {
    try {
      const response = await getMe();
      if (response) {
        setIsAdminUser(response.isAdmin ?? false);
      }else{
        setIsAdminUser(false);
      }
    }catch (error) {
      toast.error("Could not authenticate user");
    }
  };

  const handleDeleteSite = async (site: SiteData) => {
    try {
      if (!site.id) {
        toast.error('Site ID is missing.');
        return;
      }
      const response = await deleteSite(site.id);
      if (response.ok) {
        toast.success('Site deleted successfully!');
        setSiteToDelete(null);
      } else {
        toast.error('Failed to delete site. Please try again.');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the site. Please try again.');
    }
  };

  const handleCancel = () => {
    setSiteToDelete(null);
  };

  const handleDeleteClick = (site: SiteData) => {
    setSiteToDelete(site);
  }


  return (
    <div>
    <ConfirmDelete
               site={siteToDelete}
               handleConfirm={handleDeleteSite.bind(null, siteToDelete!)}
               handleCancel={handleCancel}
            />

    <div style={styles.wrapper}>

      <div style={styles.header}>
        <span style={styles.headerTitle}>Sampling Sites</span>
        <span style={styles.headerCount}>{uniqueSites.length} sites</span>
      </div>

      <ul style={styles.list}>
        {sortedPoints.map((site) => {
          const isSelected = selectedSite?.id === site.id;
          let riskColor = RISK_COLOUR.unknown.fill;
          if (site.dangerZone) {
            const dangerZoneLabel = getDangerZoneLabel(site.dangerZone);
            riskColor  = RISK_COLOUR[dangerZoneLabel]?.fill;
          }
          
          return (
            <li
              key={site.id}
              onClick={() => onSelectSite(site)}
              style={{
                ...styles.item,
                background:   isSelected ? "rgba(59,130,246,0.1)"  : "transparent",
                borderColor:  isSelected ? "rgba(59,130,246,0.4)"  : "rgba(80,140,255,0.08)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  ...styles.riskBar,
                  background: riskColor,
                }}
              />

              <div style={styles.itemBody}>
                <div style={styles.dataWrapper}>
                  <div style={styles.siteName}>{site.geoLocName}</div>

                  <div style={styles.dateRow}>
                    <span style={styles.dateLabel}>Last sampled:</span>
                    <span style={styles.dateValue}>{new Date(site.collectionDate).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })}</span>
                  </div>
                </div>
                 <div>
                  {isAdminUser && (
                    <button
                      onClick={handleDeleteClick.bind(null, site)}
                    >
                      <Trash2Icon size={18} />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    width: "260px",
    height: "100%",
    background: "#f9fbff",
    border: "1px solid rgba(11, 11, 11, 0.12)",
    flexShrink:0,
    overflow:"hidden",
  },

  header: {
    display:"flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom:"1px solid rgba(80,140,255,0.12)",
    background: "#f4f7fa",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: "16px",
    fontWeight: 700,
    letterSpacing:"1.5px",
    textTransform: "uppercase",
    color: "#0e0f0f",
    fontFamily: "opensans, sans-serif",
  },
  headerCount: {
    fontSize: "12px",
    color: "#0e0f0f",
    fontFamily: "opensans, sans-serif",
    background: "rgba(200, 219, 254, 0.08)",
    padding: "2px 8px",
    borderRadius: "10px",
    border: "1px solid rgba(80,140,255,0.12)",
  },
  contaminationLevelHeader: {
    fontSize: "12px",
    color: "#0e0f0f",
    marginTop:"12px",
    marginBottom: "6px",
  },

  list: {
    listStyle:"none",
    padding: "8px",
    overflowY:"auto",
    flex: 1,
    display: "flex",
    flexDirection:"column",
    gap: "4px",
  },

  item: {
    display: "flex",
    alignItems: "stretch",
    borderRadius: "6px",
    border: "1px solid",
    transition: "all 0.15s ease",
  },

  riskBar: {
    width: "3px",
    flexShrink: 0,
  },

  itemBody: {
    flex: 1,
    padding:"10px 12px",
    display: "flex",
    flexDirection: "row",
    gap: "2px",
    minWidth: 0,
  },
  dataWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  },

  siteName: {
    fontSize:"12px",
    fontWeight: 600,
    color:"#0e0f0f",
    fontFamily:"opensans, sans-serif",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  dateRow: {
    display: "flex",
    alignItems: "center",
    gap:  "6px",
    marginTop: "4px",
  },

  dateLabel: {
    fontSize: "9px",
    color: "#333b46",
    fontFamily:"opensans, sans-serif",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },

  dateValue: {
    fontSize:"9px",
    color: "#64748b",
    fontFamily: "opensans, sans-serif",
  },

};
