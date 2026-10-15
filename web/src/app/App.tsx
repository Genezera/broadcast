import { RouterProvider } from "react-router-dom";
import GlobalStyles from "@mui/material/GlobalStyles";
import { StyledEngineProvider } from "@mui/material/styles";
import { SplashScreen } from "../components/ui/SplashScreen";
import { AuthProvider, useAuth } from "../features/auth/AuthProvider";
import { I18nProvider } from "../i18n/I18nProvider";
import { NotificationProvider } from "./providers/NotificationProvider";
import { ThemeModeProvider } from "./providers/ThemeModeProvider";
import { router } from "./routes/router";

// A splash fica acima do router: a tela de baixo já monta enquanto o painel
// roxo ainda cobre, e é revelada quando ele abre.
function AppContent() {
  const { ready } = useAuth();
  return (
    <>
      <RouterProvider router={router} />
      <SplashScreen ready={ready} />
    </>
  );
}

export default function App() {
  return (
    // MUI + Tailwind: coloco os estilos do MUI numa camada CSS (`mui`) abaixo
    // das utilities do Tailwind. Assim uma classe como "w-9" consegue
    // sobrescrever um componente do MUI sem precisar de !important.
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <I18nProvider>
        <ThemeModeProvider>
          <NotificationProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </NotificationProvider>
        </ThemeModeProvider>
      </I18nProvider>
    </StyledEngineProvider>
  );
}
