import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useCurrentUser } from "../../features/auth/AuthProvider";
import { signOutUser } from "../../features/auth/authService";
import { resolveDisplayName } from "../../features/profile/displayName";
import { UserAvatar } from "../../features/profile/components/UserAvatar";
import { useProfile } from "../../features/profile/ProfileProvider";

/** Foto do cliente no cabeçalho; abre o menu com Minha conta e Sair. */
export function AccountMenu() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { profile } = useProfile();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const name = resolveDisplayName(profile, user);
  const close = () => setAnchor(null);

  return (
    <>
      <IconButton
        aria-label="Abrir menu da conta"
        aria-haspopup="menu"
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ p: 0.5 }}
      >
        <UserAvatar />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 220 } } }}
      >
        <div className="px-4 pb-2 pt-1">
          <p className="truncate font-bold">{name}</p>
          <p className="text-xs text-muted">Minha conta</p>
        </div>
        <Divider />
        <MenuItem
          onClick={() => {
            close();
            navigate("/profile");
          }}
        >
          <ListItemIcon>
            <PersonOutlineIcon fontSize="small" />
          </ListItemIcon>
          Perfil e senha
        </MenuItem>
        <MenuItem
          onClick={() => {
            close();
            void signOutUser();
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sair
        </MenuItem>
      </Menu>
    </>
  );
}
