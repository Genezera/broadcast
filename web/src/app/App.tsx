import { RouterProvider } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { SplashScreen } from "../components/ui/SplashScreen";
import { AuthProvider, useAuth } from "../features/auth/AuthProvider";
import { NotificationProvider } from "./providers/NotificationProvider";
import { router } from "./routes/router";
import { theme } from "./theme";

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
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
