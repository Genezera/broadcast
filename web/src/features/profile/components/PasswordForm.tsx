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
import { useI18n } from "../../../i18n/I18nProvider";
import { useRevalidateOnLanguage } from "../../../i18n/useRevalidateOnLanguage";
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
  const { t } = useI18n();
  const user = useCurrentUser();
  const notify = useNotify();
  const [visible, setVisible] = useState(false);
  // Guardo o erro (não o texto) para a mensagem acompanhar o idioma.
  const [error, setError] = useState<{
    wrongCurrent: boolean;
    cause?: unknown;
  } | null>(null);

  const { control, handleSubmit, reset, trigger, formState } =
    useForm<ChangePasswordValues>({
      resolver: zodResolver(changePasswordSchema(t)),
      defaultValues: empty,
    });

  useRevalidateOnLanguage({ trigger, formState });

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await changePassword(user, values.currentPassword, values.newPassword);
      notify.success(t("profile.security.success"));
      reset(empty);
    } catch (cause) {
      const code = (cause as { code?: string }).code ?? "";
      // Aqui "credencial inválida" só pode ser a senha atual errada.
      setError({
        wrongCurrent:
          code === "auth/invalid-credential" || code === "auth/wrong-password",
        cause,
      });
    }
  });

  const toggle = (
    <InputAdornment position="end">
      <IconButton
        edge="end"
        size="small"
        aria-label={
          visible ? t("profile.security.hide") : t("profile.security.show")
        }
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
          label={t("profile.security.current")}
          type={type}
          fullWidth
          autoComplete="current-password"
          slotProps={{ input: { endAdornment: toggle } }}
        />
        <FormTextField
          control={control}
          name="newPassword"
          label={t("profile.security.new")}
          type={type}
          fullWidth
          autoComplete="new-password"
          helperText={t("profile.security.hint")}
        />
        <FormTextField
          control={control}
          name="confirmPassword"
          label={t("profile.security.confirm")}
          type={type}
          fullWidth
          autoComplete="new-password"
        />
        {error && (
          <Alert severity="error">
            {error.wrongCurrent
              ? t("profile.security.wrongCurrent")
              : getErrorMessage(error.cause, t)}
          </Alert>
        )}
        <div>
          <Button
            type="submit"
            variant="contained"
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting
              ? t("profile.security.submitting")
              : t("profile.security.submit")}
          </Button>
        </div>
      </Stack>
    </form>
  );
}
