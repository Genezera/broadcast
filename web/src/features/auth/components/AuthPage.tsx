import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { BrandMark } from "../../../components/ui/BrandMark";
import { LanguageToggle } from "../../../components/ui/LanguageToggle";
import { ThemeToggle } from "../../../components/ui/ThemeToggle";
import { useT } from "../../../i18n/I18nProvider";
import { useRevalidateOnLanguage } from "../../../i18n/useRevalidateOnLanguage";
import { FormTextField } from "../../../components/ui/FormTextField";
import { getErrorMessage } from "../../../lib/errors";
import { requestPasswordReset, signIn, signUp } from "../authService";
import {
  emailSchema,
  signInSchema,
  signUpSchema,
  type AuthFormValues,
} from "../schemas";
import { AuthHero } from "./AuthHero";

export function AuthPage() {
  const t = useT();
  const [registering, setRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Guardo o erro (não o texto) para a mensagem acompanhar a troca de idioma.
  const [error, setError] = useState<unknown>(null);
  const [resetSent, setResetSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState,
    getValues,
    trigger,
    setError: setFieldError,
  } = useForm<AuthFormValues>({
    // O schema muda entre login e cadastro (a regra de senha é diferente).
    resolver: zodResolver(registering ? signUpSchema(t) : signInSchema(t)),
    defaultValues: { name: "", email: "", password: "" },
  });

  useRevalidateOnLanguage({ trigger, formState });

  // Em login e cadastro o erro vem do Firebase (senha errada, e-mail em uso...).
  // getErrorMessage traduz o código para algo que o usuário entende.
  const submit = handleSubmit(async ({ name, email, password }) => {
    setError(null);
    setResetSent(false);
    try {
      if (registering) await signUp(email, password, name);
      else await signIn(email, password);
    } catch (cause) {
      setError(cause);
    }
  });

  const toggleMode = () => {
    setRegistering((current) => !current);
    setError(null);
    setResetSent(false);
  };

  // Reaproveita o e-mail já digitado no formulário; só ele é validado aqui.
  const resetPassword = async () => {
    setError(null);
    setResetSent(false);
    const parsed = emailSchema(t).safeParse(getValues("email"));
    if (!parsed.success) {
      setFieldError("email", { message: parsed.error.issues[0].message });
      return;
    }
    try {
      await requestPasswordReset(parsed.data);
      // Mensagem neutra: não revelo se o e-mail tem conta ou não.
      setResetSent(true);
    } catch (cause) {
      setError(cause);
    }
  };

  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-2">
      <AuthHero />
      <div className="relative flex items-center justify-center p-6 sm:p-12">
        <div className="animate-fade absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div
          className="stagger-children w-full max-w-[430px]"
          style={{
            ["--base" as string]: "150ms",
            ["--step" as string]: "200ms",
          }}
        >
          <div className="mb-12 lg:hidden">
            <BrandMark />
          </div>
          <div className="mb-9">
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontSize: 32, mb: 1 }}
            >
              {registering ? t("auth.signUp.title") : t("auth.signIn.title")}
            </Typography>
            <Typography color="text.secondary">
              {registering
                ? t("auth.signUp.subtitle")
                : t("auth.signIn.subtitle")}
            </Typography>
          </div>

          <form
            onSubmit={submit}
            noValidate
            className="stagger-children flex flex-col gap-5"
            style={{
              ["--base" as string]: "650ms",
              ["--step" as string]: "150ms",
            }}
          >
            {registering && (
              <FormTextField
                control={control}
                name="name"
                label={t("auth.fields.name")}
                fullWidth
                autoComplete="name"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon fontSize="small" color="disabled" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}
            <FormTextField
              control={control}
              name="email"
              label={t("auth.fields.email")}
              type="email"
              fullWidth
              autoComplete="email"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineIcon fontSize="small" color="disabled" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FormTextField
              control={control}
              name="password"
              label={t("auth.fields.password")}
              type={showPassword ? "text" : "password"}
              fullWidth
              autoComplete={registering ? "new-password" : "current-password"}
              helperText={
                registering ? t("auth.signUp.passwordHint") : undefined
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" color="disabled" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        size="small"
                        aria-label={
                          showPassword
                            ? t("auth.fields.hidePassword")
                            : t("auth.fields.showPassword")
                        }
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? (
                          <VisibilityOffOutlinedIcon fontSize="small" />
                        ) : (
                          <VisibilityOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            {!registering && (
              <button
                type="button"
                className="-mt-2 cursor-pointer self-end text-sm font-bold text-brand hover:underline"
                onClick={resetPassword}
              >
                {t("auth.signIn.forgot")}
              </button>
            )}
            {error !== null && (
              <Alert severity="error">{getErrorMessage(error, t)}</Alert>
            )}
            {resetSent && (
              <Alert severity="success">{t("auth.signIn.resetSent")}</Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={formState.isSubmitting}
              endIcon={
                formState.isSubmitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <ArrowForwardIcon />
                )
              }
            >
              {registering ? t("auth.signUp.submit") : t("auth.signIn.submit")}
            </Button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <Divider className="flex-1" />
            <span className="text-xs text-muted">{t("auth.or")}</span>
            <Divider className="flex-1" />
          </div>
          <p className="text-center text-muted">
            {registering
              ? t("auth.signUp.haveAccount")
              : t("auth.signIn.noAccount")}{" "}
            <button
              type="button"
              className="cursor-pointer font-bold text-brand hover:underline"
              onClick={toggleMode}
            >
              {registering
                ? t("auth.signUp.signInLink")
                : t("auth.signIn.signUpLink")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
