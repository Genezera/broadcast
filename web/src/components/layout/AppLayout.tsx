import { Link, Outlet, useLocation, useNavigation } from "react-router-dom";
import { IconButton, Tooltip, useMediaQuery } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useCurrentUser } from "../../features/auth/AuthProvider";
import { signOutUser } from "../../features/auth/authService";
import { ConnectionsProvider } from "../../features/connections/ConnectionsProvider";
import { HelpAssistant } from "../../features/help/HelpAssistant";
import { UserAvatar } from "../../features/profile/components/UserAvatar";
import {
  firstName,
  resolveDisplayName,
} from "../../features/profile/displayName";
import {
  ProfileProvider,
  useProfile,
} from "../../features/profile/ProfileProvider";
import { BrandMark } from "../ui/BrandMark";
import { useT } from "../../i18n/I18nProvider";
import { NotificationBell } from "../../features/notifications/NotificationBell";
import { NotificationsProvider } from "../../features/notifications/NotificationsProvider";
import { LanguageToggle } from "../ui/LanguageToggle";
import { ThemeToggle } from "../ui/ThemeToggle";
import { AccountMenu } from "./AccountMenu";
import {
  NAV_ITEMS,
  sectionFromPath,
  type NavItem,
  type Section,
} from "./navigation";

/**
 * Item do menu lateral. No desktop mostra ícone + texto; no tablet vira um
 * "trilho" só de ícones (o texto aparece em um tooltip).
 */
function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const t = useT();
  const label = t(item.labelKey);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  return (
    <Tooltip title={label} placement="right" disableHoverListener={isDesktop}>
      <Link
        to={item.to}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={`sidebar-link justify-center px-0 lg:justify-start lg:px-[13px] ${active ? "active" : ""}`}
      >
        {item.icon}
        <span className="hidden lg:inline">{label}</span>
      </Link>
    </Tooltip>
  );
}

/** Barra de navegação inferior, só no celular (alcance do polegar). */
function BottomNav({ section }: { section: Section }) {
  const t = useT();
  return (
    <nav
      aria-label={t("nav.mainMenu")}
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
          {t(item.labelKey)}
        </Link>
      ))}
    </nav>
  );
}

/** Barra fina no topo enquanto a próxima tela (carregada sob demanda) chega. */
function NavigationProgress() {
  const { state } = useNavigation();
  const t = useT();
  if (state === "idle") return null;
  return (
    <div
      className="fixed inset-x-0 top-0 z-[2000] h-[3px] overflow-hidden bg-brand-soft"
      role="progressbar"
      aria-label={t("nav.loadingPage")}
    >
      <div className="nav-progress h-full w-2/5 rounded-full bg-brand" />
    </div>
  );
}

function Shell() {
  const t = useT();
  const user = useCurrentUser();
  const { profile } = useProfile();
  const { pathname } = useLocation();
  const section = sectionFromPath(pathname);
  const current = NAV_ITEMS.find((item) => item.id === section);
  const title =
    section === "profile" ? t("nav.account") : current && t(current.labelKey);
  const name = resolveDisplayName(profile, user, t("nav.defaultUserName"));

  const logout = (
    <Tooltip title={t("nav.logout")}>
      <IconButton
        size="small"
        aria-label={t("nav.logout")}
        onClick={signOutUser}
      >
        <LogoutIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  return (
    <>
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
            {t("nav.menuHeading")}
          </p>
          <nav className="w-full space-y-1" aria-label={t("nav.mainMenu")}>
            {NAV_ITEMS.map((item) => (
              <SidebarLink
                key={item.id}
                item={item}
                active={section === item.id}
              />
            ))}
          </nav>

          {/* Rodapé: trilho (foto + sair) / desktop (cartão da conta). */}
          <div className="mt-auto flex flex-col items-center gap-2 lg:hidden">
            <Tooltip title={t("nav.account")} placement="right">
              <Link to="/profile" aria-label={t("nav.account")}>
                <UserAvatar />
              </Link>
            </Tooltip>
            {logout}
          </div>
          <div className="mt-auto hidden lg:block">
            <div
              className={`flex items-center gap-1 rounded-xl border p-2 transition-colors ${section === "profile" ? "border-brand/40 bg-brand-soft" : "border-line"}`}
            >
              <Link
                to="/profile"
                aria-label={t("nav.account")}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 transition-colors hover:bg-surface-hover"
              >
                <UserAvatar size={40} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{name}</p>
                  <p className="text-xs text-muted">{t("nav.account")}</p>
                </div>
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="animate-drop-in sticky top-0 z-30 flex h-[64px] items-center justify-between gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur sm:h-[72px] sm:px-6 lg:px-9">
            <div className="flex min-w-0 items-center gap-3">
              <div className="md:hidden">
                <BrandMark size="sm" showName={false} />
              </div>
              {/* No celular a página já mostra o próprio título; aqui falta espaço. */}
              <p className="hidden truncate font-display text-lg font-extrabold sm:block">
                {title}
              </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
              <span className="hidden max-w-[200px] truncate text-sm text-muted lg:inline">
                {t("nav.hello", { name: firstName(name) })}
              </span>
              <LanguageToggle />
              <NotificationBell />
              <ThemeToggle />
              <AccountMenu />
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
      <HelpAssistant />
    </>
  );
}

export function AppLayout() {
  const user = useCurrentUser();
  return (
    <ProfileProvider tenantId={user.uid}>
      <ConnectionsProvider tenantId={user.uid}>
        <NotificationsProvider tenantId={user.uid}>
          <Shell />
        </NotificationsProvider>
      </ConnectionsProvider>
    </ProfileProvider>
  );
}
