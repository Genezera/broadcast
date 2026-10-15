import { Link, Outlet, useLocation, useNavigation } from "react-router-dom";
import { Avatar, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useCurrentUser } from "../../features/auth/AuthProvider";
import { signOutUser } from "../../features/auth/authService";
import { ConnectionsProvider } from "../../features/connections/ConnectionsProvider";
import { BrandMark } from "../ui/BrandMark";
import { ThemeToggle } from "../ui/ThemeToggle";
import { NAV_ITEMS, sectionFromPath, type NavItem } from "./navigation";

/**
 * Item do menu lateral. No desktop mostra ícone + texto; no tablet vira um
 * "trilho" só de ícones (o texto aparece em um tooltip).
 */
function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  return (
    <Tooltip
      title={item.label}
      placement="right"
      disableHoverListener={isDesktop}
    >
      <Link
        to={item.to}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        className={`sidebar-link justify-center px-0 lg:justify-start lg:px-[13px] ${active ? "active" : ""}`}
      >
        {item.icon}
        <span className="hidden lg:inline">{item.label}</span>
      </Link>
    </Tooltip>
  );
}

/** Barra de navegação inferior, só no celular (alcance do polegar). */
function BottomNav({ section }: { section: NavItem["id"] }) {
  return (
    <nav
      aria-label="Menu principal"
      className="animate-rise-in fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 border-t border-line bg-surface/90 px-2 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] backdrop-blur md:hidden"
    >
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.id}
          to={item.to}
          aria-current={section === item.id ? "page" : undefined}
          className={`bottom-link ${section === item.id ? "active" : ""}`}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
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

  const logout = (
    <Tooltip title="Sair">
      <IconButton size="small" aria-label="Sair" onClick={signOutUser}>
        <LogoutIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  return (
    <ConnectionsProvider tenantId={user.uid}>
      <NavigationProgress />
      <div className="min-h-screen md:flex">
        {/* Tablet: trilho de 84px. Desktop: menu completo de 248px. */}
        <aside className="animate-slide-in sticky top-0 hidden h-screen w-[84px] shrink-0 flex-col items-center border-r border-line bg-surface px-3 py-7 md:flex lg:w-[248px] lg:items-stretch lg:px-4">
          <div className="mb-10 flex justify-center lg:mb-12 lg:justify-start lg:px-3">
            <div className="lg:hidden">
              <BrandMark showName={false} />
            </div>
            <div className="hidden lg:block">
              <BrandMark />
            </div>
          </div>
          <p className="mb-3 hidden px-3 text-[11px] font-extrabold tracking-[.13em] text-muted lg:block">
            MENU PRINCIPAL
          </p>
          <nav className="w-full space-y-1" aria-label="Menu principal">
            {NAV_ITEMS.map((item) => (
              <SidebarLink
                key={item.id}
                item={item}
                active={section === item.id}
              />
            ))}
          </nav>

          {/* Rodapé: trilho (avatar + sair) / desktop (cartão da conta). */}
          <div className="mt-auto flex flex-col items-center gap-2 lg:hidden">
            <Avatar className="avatar-brand">{initial}</Avatar>
            {logout}
          </div>
          <div className="mt-auto hidden px-2 lg:block">
            <div className="flex items-center gap-3 rounded-xl border border-line p-3">
              <Avatar className="avatar-brand">{initial}</Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">Minha conta</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
              {logout}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="animate-drop-in sticky top-0 z-30 flex h-[64px] items-center justify-between gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur sm:h-[72px] sm:px-6 lg:px-9">
            <div className="flex min-w-0 items-center gap-3">
              <div className="md:hidden">
                <BrandMark size="sm" showName={false} />
              </div>
              <p className="truncate font-display text-lg font-extrabold">
                {current?.label}
              </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
              <span className="hidden max-w-[200px] truncate text-sm text-muted lg:inline">
                Olá, {user.email?.split("@")[0]}
              </span>
              <ThemeToggle />
              <Avatar className="avatar-brand !hidden sm:!flex">
                {initial}
              </Avatar>
              <div className="md:hidden">{logout}</div>
            </div>
          </header>

          <main className="mx-auto max-w-[1440px] p-4 pb-28 sm:p-6 sm:pb-28 md:pb-9 lg:p-9">
            {/* key = rota: a cada troca de página a entrada anima de novo. */}
            <div key={pathname} className="animate-page">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <BottomNav section={section} />
    </ConnectionsProvider>
  );
}
