import { Avatar } from "@mui/material";
import { useI18n } from "../../../i18n/I18nProvider";
import { useCurrentUser } from "../../auth/AuthProvider";
import { initialOf, resolveDisplayName } from "../displayName";
import { useProfile } from "../ProfileProvider";

/** Foto do cliente; sem foto, a inicial do nome sobre o fundo da marca. */
export function UserAvatar({ size = 36 }: { size?: number }) {
  const { t } = useI18n();
  const user = useCurrentUser();
  const { profile } = useProfile();
  const name = resolveDisplayName(profile, user, t("nav.defaultUserName"));

  return (
    <Avatar
      className="avatar-brand"
      src={profile?.photoData || undefined}
      alt={name}
      style={{ ["--avatar-size" as string]: `${size}px` }}
    >
      {initialOf(name)}
    </Avatar>
  );
}
