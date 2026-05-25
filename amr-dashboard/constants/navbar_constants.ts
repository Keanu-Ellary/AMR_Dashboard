import { NavItem } from "@/types/navbar_types";
import { LayoutDashboard, PieChartIcon, PlusCircleIcon, FileScan, History, Settings } from "lucide-react";

export const NAV_ITEMS: NavItem[] = [
  { href: "/home", icon: LayoutDashboard, label: "Overview" },
  { href: "/analyze", icon: FileScan, label: "Analyze Single Image" },
  { href: "/statistics", icon: PieChartIcon, label: "Statistics" },
  { href: "/changelog", icon: History, label: "Change Log" },
  { href: "/data-management", icon: Settings, label: "Data Management" },
];