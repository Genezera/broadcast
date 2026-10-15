import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Stack, TextField } from "@mui/material";
import { useNotify } from "../../../app/providers/NotificationProvider";
import { FormTextField } from "../../../components/ui/FormTextField";
import { formatDateTime } from "../../../lib/dates";
import { getErrorMessage } from "../../../lib/errors";
import { useCurrentUser } from "../../auth/AuthProvider";
import { resolveDisplayName } from "../displayName";
import { profileSchema, type ProfileFormValues } from "../schemas";
import { updateProfileName } from "../profileService";
import { useProfile } from "../ProfileProvider";

/** Nome do cliente e dados da conta. O e-mail é só de leitura. */
export function ProfileForm() {
  const user = useCurrentUser();
  const { profile } = useProfile();
  const notify = useNotify();
  const currentName = resolveDisplayName(profile, user);

  const { control, handleSubmit, reset, formState } =
    useForm<ProfileFormValues>({
      resolver: zodResolver(profileSchema),
      defaultValues: { name: currentName },
    });

  // Se o nome mudar por outro lado (outra aba), o formulário acompanha.
  useEffect(() => reset({ name: currentName }), [currentName, reset]);

  const submit = handleSubmit(async ({ name }) => {
    try {
      await updateProfileName(user, name);
      notify.success("Nome atualizado.");
    } catch (cause) {
      notify.error(getErrorMessage(cause));
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <Stack spacing={2.5}>
        <FormTextField
          control={control}
          name="name"
          label="Nome"
          fullWidth
          autoComplete="name"
          slotProps={{ htmlInput: { maxLength: 60 } }}
        />
        <TextField
          label="E-mail de acesso"
          value={user.email ?? ""}
          fullWidth
          disabled
          helperText="O e-mail é o seu login e não pode ser alterado aqui."
        />
        {profile?.createdAt && (
          <p className="text-sm text-muted">
            Conta criada em {formatDateTime(profile.createdAt)}
          </p>
        )}
        <div>
          <Button
            type="submit"
            variant="contained"
            disabled={formState.isSubmitting || !formState.isDirty}
          >
            {formState.isSubmitting ? "Salvando..." : "Salvar nome"}
          </Button>
        </div>
      </Stack>
    </form>
  );
}
