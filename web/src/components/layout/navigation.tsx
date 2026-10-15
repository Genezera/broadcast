import type { ReactNode } from "react";
import type { TKey } from "../../i18n/translate";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";

export type NavItem = {
  id: "overview" | "connections" | "contacts" | "broadcasts";
  /** Chave de tradução do rótulo do menu. */
  labelKey: TKey;
  to: string;
  icon: ReactNode;
};

export const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    labelKey: "nav.overview",
    to: "/",
    icon: <DashboardOutlinedIcon fontSize="small" />,
  },
  {
    id: "connections",
    labelKey: "nav.connections",
    to: "/connections",
    icon: <HubOutlinedIcon fontSize="small" />,
  },
  {
    id: "contacts",
    labelKey: "nav.contacts",
    to: "/contacts",
    icon: <PeopleOutlineIcon fontSize="small" />,
  },
  {
    id: "broadcasts",
    labelKey: "nav.broadcasts",
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
