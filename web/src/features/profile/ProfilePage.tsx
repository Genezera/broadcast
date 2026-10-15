import type { ReactNode } from "react";
import { Button, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { PageHeader } from "../../components/ui/PageHeader";
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
  return (
    <>
      <PageHeader
        title="Minha conta"
        description="Gerencie seu perfil, sua foto e sua senha."
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Section
            index={0}
            title="Foto"
            description="Aparece no menu e no cabeçalho."
          >
            <AvatarUploader />
          </Section>
          <Section
            index={1}
            title="Perfil"
            description="Como você é identificado no sistema."
          >
            <ProfileForm />
          </Section>
        </div>
        <div className="flex flex-col gap-5">
          <Section
            index={2}
            title="Segurança"
            description="Escolha uma senha forte e diferente das outras que você usa."
          >
            <PasswordForm />
          </Section>
          <Section
            index={3}
            title="Sessão"
            description="Encerra o acesso neste dispositivo."
          >
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={signOutUser}
            >
              Sair da conta
            </Button>
          </Section>
        </div>
      </div>
    </>
  );
}
