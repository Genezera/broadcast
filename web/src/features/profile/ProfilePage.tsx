import type { ReactNode } from "react";
import { Button, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { PageHeader } from "../../components/ui/PageHeader";
import { useI18n } from "../../i18n/I18nProvider";
import { signOutUser } from "../auth/authService";
import { AvatarUploader } from "./components/AvatarUploader";
import { PasswordForm } from "./components/PasswordForm";
import { ProfileForm } from "./components/ProfileForm";

function Section({
  title,
  description,
  index,
  children,
}: {
  title: string;
  description: string;
  index: number;
  children: ReactNode;
}) {
  return (
    <section
      className="surface animate-item p-5 sm:p-6"
      style={{ ["--i" as string]: index }}
    >
      <Typography variant="h6" component="h2">
        {title}
      </Typography>
      <Typography color="text.secondary" fontSize={13} sx={{ mb: 3 }}>
        {description}
      </Typography>
      {children}
    </section>
  );
}

export function ProfilePage() {
  const { t } = useI18n();
  return (
    <>
      <PageHeader
        title={t("profile.title")}
        description={t("profile.subtitle")}
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Section
            index={0}
            title={t("profile.photo.title")}
            description={t("profile.photo.text")}
          >
            <AvatarUploader />
          </Section>
          <Section
            index={1}
            title={t("profile.details.title")}
            description={t("profile.details.text")}
          >
            <ProfileForm />
          </Section>
        </div>
        <div className="flex flex-col gap-5">
          <Section
            index={2}
            title={t("profile.security.title")}
            description={t("profile.security.text")}
          >
            <PasswordForm />
          </Section>
          <Section
            index={3}
            title={t("profile.session.title")}
            description={t("profile.session.text")}
          >
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={signOutUser}
            >
              {t("profile.session.logout")}
            </Button>
          </Section>
        </div>
      </div>
    </>
  );
}
