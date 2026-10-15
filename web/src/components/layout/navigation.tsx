import type { ReactNode } from "react";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";

export type NavItem = {
  id: "overview" | "connections" | "contacts" | "broadcasts";
  label: string;
  to: string;
  icon: ReactNode;
};

export const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    label: "Visão geral",
    to: "/",
    icon: <DashboardOutlinedIcon fontSize="small" />,
  },
  {
    id: "connections",
    label: "Conexões",
    to: "/connections",
    icon: <HubOutlinedIcon fontSize="small" />,
  },
  {
    id: "contacts",
    label: "Contatos",
    to: "/contacts",
    icon: <PeopleOutlineIcon fontSize="small" />,
  },
  {
    id: "broadcasts",
    label: "Broadcast",
    to: "/broadcasts",
    icon: <CampaignOutlinedIcon fontSize="small" />,
  },
];

/** Seções do menu + a página de perfil, que não tem item no menu. */
export type Section = NavItem["id"] | "profile";

/** Identifica a seção do menu a partir da URL (inclusive rotas aninhadas). */
export const sectionFromPath = (pathname: string): Section => {
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.endsWith("/contacts")) return "contacts";
  if (pathname.endsWith("/broadcasts")) return "broadcasts";
  if (pathname.startsWith("/connections")) return "connections";
  return "overview";
};
