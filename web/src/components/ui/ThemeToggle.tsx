import { IconButton, Tooltip } from "@mui/material";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { useThemeMode } from "../../app/providers/ThemeModeProvider";
import { useT } from "../../i18n/I18nProvider";

/** Alterna claro/escuro. O sol e a lua trocam girando (ver .theme-icon). */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { mode, toggle } = useThemeMode();
  const t = useT();
  const label = mode === "dark" ? t("theme.toLight") : t("theme.toDark");

  return (
    <Tooltip title={label}>
      <IconButton
        className={className}
        aria-label={label}
        onClick={(event) => {
          // A animação de troca nasce do centro do botão.
          const box = event.currentTarget.getBoundingClientRect();
          toggle({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
        }}
        sx={{ position: "relative", width: 40, height: 40 }}
      >
        <LightModeOutlinedIcon className="theme-icon theme-icon-sun" />
        <DarkModeOutlinedIcon className="theme-icon theme-icon-moon" />
      </IconButton>
    </Tooltip>
  );
}
