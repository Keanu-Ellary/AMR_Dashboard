import { NavItem } from "@/types/navbar_types";
import { LayoutDashboard, PieChartIcon, PlusCircleIcon, FileScan } from "lucide-react";

export const NAV_ITEMS: NavItem[] = [
  { href: "/home", icon: LayoutDashboard, label: "Overview" },
  { href: "/add-data", icon: PlusCircleIcon, label: "Add Data" },
  { href: "/analyze", icon: FileScan, label: "Analyze Image" },
  { href: "/statistics", icon: PieChartIcon, label: "Statistics" },
];