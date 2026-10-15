import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  Stack,
} from "@mui/material";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useNotify } from "../../../app/providers/NotificationProvider";
import { FormTextField } from "../../../components/ui/FormTextField";
import { getErrorMessage } from "../../../lib/errors";
import { useCurrentUser } from "../../auth/AuthProvider";
import { changePassword } from "../../auth/authService";
import { changePasswordSchema, type ChangePasswordValues } from "../schemas";

const empty: ChangePasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

/** Troca de senha de quem já está logado (pede a senha atual). */
export function PasswordForm() {
  const user = useCurrentUser();
  const notify = useNotify();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");

  const { control, handleSubmit, reset, formState } =
    useForm<ChangePasswordValues>({
      resolver: zodResolver(changePasswordSchema),
      defaultValues: empty,
    });

  const submit = handleSubmit(async (values) => {
    setError("");
    try {
      await changePassword(user, values.currentPassword, values.newPassword);
      notify.success("Senha alterada com sucesso.");
      reset(empty);
    } catch (cause) {
      const code = (cause as { code?: string }).code ?? "";
      // Aqui "credencial inválida" só pode ser a senha atual errada.
      setError(
        code === "auth/invalid-credential" || code === "auth/wrong-password"
          ? "A senha atual está incorreta."
          : getErrorMessage(cause),
      );
    }
  });

  const toggle = (
    <InputAdornment position="end">
      <IconButton
        edge="end"
        size="small"
        aria-label={visible ? "Ocultar senhas" : "Mostrar senhas"}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? (
          <VisibilityOffOutlinedIcon fontSize="small" />
        ) : (
          <VisibilityOutlinedIcon fontSize="small" />
        )}
      </IconButton>
    </InputAdornment>
  );
  const type = visible ? "text" : "password";

  return (
    <form onSubmit={submit} noValidate>
      <Stack spacing={2.5}>
        <FormTextField
          control={control}
          name="currentPassword"
          label="Senha atual"
          type={type}
          fullWidth
          autoComplete="current-password"
          slotProps={{ input: { endAdornment: toggle } }}
        />
        <FormTextField
          control={control}
          name="newPassword"
          label="Nova senha"
          type={type}
          fullWidth
          autoComplete="new-password"
          helperText="Mínimo de 6 caracteres."
        />
        <FormTextField
          control={control}
          name="confirmPassword"
          label="Confirmar nova senha"
          type={type}
          fullWidth
          autoComplete="new-password"
        />
        {error && <Alert severity="error">{error}</Alert>}
        <div>
          <Button
            type="submit"
            variant="contained"
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? "Alterando..." : "Alterar senha"}
          </Button>
        </div>
      </Stack>
    </form>
  );
}
