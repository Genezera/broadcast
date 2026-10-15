import { Link, Outlet, useLocation, useNavigation } from "react-router-dom";
import { Avatar, IconButton, Tooltip } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useCurrentUser } from "../../features/auth/AuthProvider";
import { signOutUser } from "../../features/auth/authService";
import { ConnectionsProvider } from "../../features/connections/ConnectionsProvider";
import { BrandMark } from "../ui/BrandMark";
import { NAV_ITEMS, sectionFromPath } from "./navigation";

function SidebarLink({
  item,
  active,
  compact = false,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={`sidebar-link ${active ? "active" : ""} ${compact ? "sidebar-link-compact" : ""}`}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

/** Barra fina no topo enquanto a próxima tela (carregada sob demanda) chega. */
function NavigationProgress() {
  const { state } = useNavigation();
  if (state === "idle") return null;
  return (
    <div
      className="fixed inset-x-0 top-0 z-[2000] h-[3px] overflow-hidden bg-brand-soft"
      role="progressbar"
      aria-label="Carregando página"
    >
      <div className="nav-progress h-full w-2/5 rounded-full bg-brand" />
    </div>
  );
}

export function AppLayout() {
  const user = useCurrentUser();
  const { pathname } = useLocation();
  const section = sectionFromPath(pathname);
  const current = NAV_ITEMS.find((item) => item.id === section);
  const initial = user.email?.[0]?.toUpperCase() ?? "U";

  return (
    <ConnectionsProvider tenantId={user.uid}>
      <NavigationProgress />
      <div className="min-h-screen lg:flex">
        <aside className="animate-slide-in sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line bg-white px-4 py-7 lg:flex">
          <div className="mb-12 px-3">
            <BrandMark />
          </div>
          <p className="mb-3 px-3 text-[11px] font-extrabold tracking-[.13em] text-[#aeb0bd]">
            MENU PRINCIPAL
          </p>
          <nav className="space-y-1" aria-label="Menu principal">
            {NAV_ITEMS.map((item) => (
              <SidebarLink
                key={item.id}
                item={item}
                active={section === item.id}
              />
            ))}
          </nav>
          <div className="mt-auto px-2">
            <div className="flex items-center gap-3 rounded-xl border border-line p-3">
              <Avatar className="avatar-brand">{initial}</Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">Minha conta</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              <Tooltip title="Sair">
                <IconButton
                  size="small"
                  aria-label="Sair"
                  onClick={signOutUser}
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="animate-drop-in flex h-[76px] items-center justify-between border-b border-line bg-white px-5 lg:px-9">
            <div className="flex items-center gap-3">
              <div className="lg:hidden">
                <BrandMark size="sm" />
              </div>
              <p className="hidden text-lg font-extrabold font-display lg:block">
                {current?.label}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-muted sm:inline">
                Olá, {user.email?.split("@")[0]}
              </span>
              <Avatar className="avatar-brand">{initial}</Avatar>
              <IconButton
                className="lg:!hidden"
                size="small"
                aria-label="Sair"
                onClick={signOutUser}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </div>
          </header>

          <nav
            className="flex gap-1 overflow-x-auto border-b border-line bg-white px-3 py-2 lg:hidden"
            aria-label="Menu principal"
          >
            {NAV_ITEMS.map((item) => (
              <SidebarLink
                key={item.id}
                item={item}
                active={section === item.id}
                compact
              />
            ))}
          </nav>

          <main className="mx-auto max-w-[1440px] p-5 lg:p-9">
            {/* key = rota: a cada troca de página a entrada anima de novo. */}
            <div key={pathname} className="animate-page">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ConnectionsProvider>
  );
}
