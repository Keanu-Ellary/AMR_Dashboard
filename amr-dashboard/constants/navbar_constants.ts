import { NavItem } from "@/types/navbar_types";
import { LayoutDashboard, PieChartIcon } from "lucide-react";

export const NAV_ITEMS: NavItem[] = [
  { href: "/home", icon: LayoutDashboard, label: "Overview" },
  { href: "/statistics", icon: PieChartIcon, label: "Statistics" },
];