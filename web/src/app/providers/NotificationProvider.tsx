import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Alert, Snackbar } from "@mui/material";

type Notice = { text: string; severity: "success" | "error" };
type Notify = {
  success: (text: string) => void;
  error: (text: string) => void;
};

const NotificationContext = createContext<Notify | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);

  const success = useCallback(
    (text: string) => setNotice({ text, severity: "success" }),
    [],
  );
  const error = useCallback(
    (text: string) => setNotice({ text, severity: "error" }),
    [],
  );
  const notify = useMemo(() => ({ success, error }), [success, error]);

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Snackbar
        open={!!notice}
        autoHideDuration={5000}
        onClose={(_, reason) => reason !== "clickaway" && setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        // No celular sobe acima da barra de navegação inferior.
        sx={{ bottom: { xs: 88, md: 24 } }}
      >
        <Alert
          onClose={() => setNotice(null)}
          severity={notice?.severity ?? "success"}
          variant="filled"
        >
          {notice?.text}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

export function useNotify(): Notify {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotify deve ser usado dentro de NotificationProvider.");
  }
  return context;
}
