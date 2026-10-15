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
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { BrandMark } from "../../../components/ui/BrandMark";
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
  const [registering, setRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const {
    control,
    handleSubmit,
    formState,
    getValues,
    setError: setFieldError,
  } = useForm<AuthFormValues>({
    // O schema muda entre login e cadastro (a regra de senha é diferente).
    resolver: zodResolver(registering ? signUpSchema : signInSchema),
    defaultValues: { email: "", password: "" },
  });

  // Em login e cadastro o erro vem do Firebase (senha errada, e-mail em uso...).
  // getErrorMessage traduz o código para algo que o usuário entende.
  const submit = handleSubmit(async ({ email, password }) => {
    setError("");
    setInfo("");
    try {
      if (registering) await signUp(email, password);
      else await signIn(email, password);
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  });

  const toggleMode = () => {
    setRegistering((current) => !current);
    setError("");
    setInfo("");
  };

  // Reaproveita o e-mail já digitado no formulário; só ele é validado aqui.
  const resetPassword = async () => {
    setError("");
    setInfo("");
    const parsed = emailSchema.safeParse(getValues("email"));
    if (!parsed.success) {
      setFieldError("email", { message: parsed.error.issues[0].message });
      return;
    }
    try {
      await requestPasswordReset(parsed.data);
      // Mensagem neutra: não revelo se o e-mail tem conta ou não.
      setInfo(
        "Se o e-mail estiver cadastrado, enviaremos um link para redefinir a senha.",
      );
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  };

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <AuthHero />
      <div className="flex items-center justify-center p-6 sm:p-12">
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
              {registering ? "Crie sua conta" : "Boas-vindas de volta"}
            </Typography>
            <Typography color="text.secondary">
              {registering
                ? "Comece a organizar suas mensagens em poucos passos."
                : "Entre na sua conta para continuar."}
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
            <FormTextField
              control={control}
              name="email"
              label="E-mail"
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
              label="Senha"
              type={showPassword ? "text" : "password"}
              fullWidth
              autoComplete={registering ? "new-password" : "current-password"}
              helperText={registering ? "Mínimo de 6 caracteres." : undefined}
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
                          showPassword ? "Ocultar senha" : "Mostrar senha"
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
                Esqueci minha senha
              </button>
            )}
            {error && <Alert severity="error">{error}</Alert>}
            {info && <Alert severity="success">{info}</Alert>}
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
              {registering ? "Criar conta" : "Entrar"}
            </Button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <Divider className="flex-1" />
            <span className="text-xs text-muted">OU</span>
            <Divider className="flex-1" />
          </div>
          <p className="text-center text-muted">
            {registering ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
            <button
              type="button"
              className="cursor-pointer font-bold text-brand hover:underline"
              onClick={toggleMode}
            >
              {registering ? "Entrar" : "Cadastre-se"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
