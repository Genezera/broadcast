import { useEffect, useState } from "react";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import { useT } from "../../i18n/I18nProvider";

// Tempo total da saída (precisa cobrir a sequência de .splash-leaving em
// styles.css): o carregamento some, a marca esmaece e o painel roxo abre
// para a direita.
const LEAVE_MS = 1600;

type Phase = "visible" | "leaving" | "gone";

/**
 * Abertura do site. Cobre a tela enquanto o Firebase restaura a sessão e,
 * quando `ready` vira true, sai em sequência revelando a tela por baixo.
 * Vive acima do router, então só aparece uma vez por carregamento da página.
 */
export function SplashScreen({ ready }: { ready: boolean }) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("visible");

  useEffect(() => {
    if (ready) {
      setPhase((current) => (current === "visible" ? "leaving" : current));
    }
  }, [ready]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = setTimeout(() => setPhase("gone"), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      className={`splash ${phase === "leaving" ? "splash-leaving" : ""}`}
      role="status"
      aria-label={t("common.loading")}
    >
      <div className="splash-glow" />
      <div className="splash-content">
        <span className="brand-mark splash-logo !h-16 !w-16 !rounded-[20px]">
          <CampaignOutlinedIcon fontSize="large" />
        </span>
        <span className="splash-name font-display text-3xl font-extrabold tracking-tight text-white">
          broadcast<span className="text-[#a99fff]">.</span>
        </span>
        <div className="splash-loader">
          <div className="splash-loader-bar" />
        </div>
      </div>
    </div>
  );
}
