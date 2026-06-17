import { NavItem } from "@/types/navbar_types";
import { LayoutDashboard, PieChartIcon, Users, FileScan, History, Settings } from "lucide-react";

export const NAV_ITEMS: NavItem[] = [
  { href: "/home", icon: LayoutDashboard, label: "Overview" },
  { href: "/analyze", icon: FileScan, label: "Analyze Single Image" },
  { href: "/visualizations", icon: PieChartIcon, label: "Visualizations" },
  { href: "/changelog", icon: History, label: "Change Log" },
  { href: "/data-management", icon: Settings, label: "Data Management" },
  { href: "/user-management", icon: Users, label: "Admin Management" }
];