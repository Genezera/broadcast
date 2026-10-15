import Grow from "@mui/material/Grow";
import { createTheme } from "@mui/material/styles";

// Curva usada em todas as microinterações (rápida no início, suave no fim).
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#6556eb" },
    secondary: { main: "#221e45" },
    background: { default: "#f7f8fb", paper: "#fff" },
    text: { primary: "#24243e", secondary: "#84869b" },
    divider: "#edf0f5",
  },
  typography: {
    fontFamily: "DM Sans, sans-serif",
    h4: { fontFamily: "Manrope, sans-serif", fontWeight: 800 },
    h5: { fontFamily: "Manrope, sans-serif", fontWeight: 800 },
    h6: { fontFamily: "Manrope, sans-serif", fontWeight: 800 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: "none",
          padding: "9px 17px",
          transition: `transform 0.2s ${EASE}, box-shadow 0.2s ease, background-color 0.2s ease`,
          "&:active:not(.Mui-disabled)": { transform: "scale(0.97)" },
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 8px 20px rgba(101, 86, 235, 0.28)",
            transform: "translateY(-1px)",
          },
          "&:active:not(.Mui-disabled)": { transform: "scale(0.97)" },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: `transform 0.2s ${EASE}, background-color 0.2s ease`,
          "&:hover": { transform: "scale(1.1)" },
          "&:active": { transform: "scale(0.9)" },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": { background: "#fff", borderRadius: 10 },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 700,
          transition: "background-color 0.25s ease, color 0.25s ease",
        },
      },
    },
    // Diálogos abrem com um "grow" (escala + fade) e o fundo com leve desfoque.
    MuiDialog: {
      defaultProps: { slots: { transition: Grow } },
      styleOverrides: { paper: { borderRadius: 18 } },
    },
    MuiBackdrop: {
      styleOverrides: {
        // Só nos fundos visíveis (diálogos); menus usam backdrop invisível.
        root: {
          transition: "opacity 0.3s ease",
          "&:not(.MuiBackdrop-invisible)": { backdropFilter: "blur(3px)" },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          transition: `transform 0.15s ${EASE}`,
          "&:active": { transform: "scale(0.88)" },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 700 } } },
  },
});
