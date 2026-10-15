import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Stack, TextField } from "@mui/material";
import { useNotify } from "../../../app/providers/NotificationProvider";
import { FormTextField } from "../../../components/ui/FormTextField";
import { useI18n } from "../../../i18n/I18nProvider";
import { useRevalidateOnLanguage } from "../../../i18n/useRevalidateOnLanguage";
import { getErrorMessage } from "../../../lib/errors";
import { useCurrentUser } from "../../auth/AuthProvider";
import { resolveDisplayName } from "../displayName";
import { profileSchema, type ProfileFormValues } from "../schemas";
import { updateProfileName } from "../profileService";
import { useProfile } from "../ProfileProvider";

/** Nome do cliente e dados da conta. O e-mail é só de leitura. */
export function ProfileForm() {
  const { t, formatDateTime } = useI18n();
  const user = useCurrentUser();
  const { profile } = useProfile();
  const notify = useNotify();
  const currentName = resolveDisplayName(
    profile,
    user,
    t("nav.defaultUserName"),
  );

  const { control, handleSubmit, reset, trigger, formState } =
    useForm<ProfileFormValues>({
      resolver: zodResolver(profileSchema(t)),
      defaultValues: { name: currentName },
    });

  // Se o nome mudar por outro lado (outra aba), o formulário acompanha.
  useEffect(() => reset({ name: currentName }), [currentName, reset]);

  useRevalidateOnLanguage({ trigger, formState });

  const submit = handleSubmit(async ({ name }) => {
    try {
      await updateProfileName(user, name);
      notify.success(t("profile.details.saved"));
    } catch (cause) {
      notify.error(getErrorMessage(cause, t));
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <Stack spacing={2.5}>
        <FormTextField
          control={control}
          name="name"
          label={t("profile.details.nameLabel")}
          fullWidth
          autoComplete="name"
          slotProps={{ htmlInput: { maxLength: 60 } }}
        />
        <TextField
          label={t("profile.details.emailLabel")}
          value={user.email ?? ""}
          fullWidth
          disabled
          helperText={t("profile.details.emailHint")}
        />
        {profile?.createdAt && (
          <p className="text-sm text-muted">
            {t("profile.details.createdAt", {
              date: formatDateTime(profile.createdAt),
            })}
          </p>
        )}
        <div>
          <Button
            type="submit"
            variant="contained"
            disabled={formState.isSubmitting || !formState.isDirty}
          >
            {formState.isSubmitting
              ? t("common.saving")
              : t("profile.details.save")}
          </Button>
        </div>
      </Stack>
    </form>
  );
}
