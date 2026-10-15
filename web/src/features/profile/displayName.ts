type ProfileLike = { name?: string | null } | null | undefined;
type UserLike = { displayName?: string | null; email?: string | null };

/**
 * Nome exibido na interface. Prefere o do perfil (em tempo real), depois o do
 * Auth e, para contas antigas sem nome, a parte inicial do e-mail.
 */
export const resolveDisplayName = (
  profile: ProfileLike,
  user: UserLike,
  fallback = "User",
): string =>
  profile?.name?.trim() ||
  user.displayName?.trim() ||
  user.email?.split("@")[0] ||
  fallback;

export const firstName = (fullName: string): string =>
  fullName.trim().split(/\s+/)[0] ?? fullName;

export const initialOf = (fullName: string): string =>
  fullName.trim()[0]?.toUpperCase() ?? "U";
