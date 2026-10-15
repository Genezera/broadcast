import { useRef, useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import { useNotify } from "../../../app/providers/NotificationProvider";
import { getErrorMessage } from "../../../lib/errors";
import { fileToAvatarDataUrl, validateImageFile } from "../../../lib/image";
import { useCurrentUser } from "../../auth/AuthProvider";
import { updateProfilePhoto } from "../profileService";
import { useProfile } from "../ProfileProvider";
import { UserAvatar } from "./UserAvatar";

/** Foto grande com os botões de trocar e remover. */
export function AvatarUploader() {
  const user = useCurrentUser();
  const { profile } = useProfile();
  const notify = useNotify();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const save = async (photoData: string | null, message: string) => {
    setBusy(true);
    try {
      await updateProfilePhoto(user.uid, photoData);
      notify.success(message);
    } catch (cause) {
      notify.error(getErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      notify.error(problem);
      return;
    }
    try {
      await save(await fileToAvatarDataUrl(file), "Foto atualizada.");
    } catch {
      notify.error("Não foi possível ler essa imagem. Tente outra.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <div className="relative">
        <UserAvatar size={96} />
        {busy && (
          <div className="absolute inset-0 grid place-items-center rounded-full bg-black/40">
            <CircularProgress size={26} sx={{ color: "white" }} />
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-2 sm:items-start">
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <Button
            variant="outlined"
            startIcon={<PhotoCameraOutlinedIcon />}
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {profile?.photoData ? "Trocar foto" : "Adicionar foto"}
          </Button>
          {profile?.photoData && (
            <Button
              color="error"
              startIcon={<DeleteOutlineIcon />}
              disabled={busy}
              onClick={() => save(null, "Foto removida.")}
            >
              Remover
            </Button>
          )}
        </div>
        <p className="text-xs text-muted">JPG, PNG ou WebP, até 5 MB.</p>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          void onFile(event.target.files?.[0]);
          // Permite escolher o mesmo arquivo de novo depois de remover.
          event.target.value = "";
        }}
      />
    </div>
  );
}
