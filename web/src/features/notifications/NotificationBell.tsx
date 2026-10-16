import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Button,
  Divider,
  IconButton,
  Popover,
  Tooltip,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ScheduleSendOutlinedIcon from "@mui/icons-material/ScheduleSendOutlined";
import { useNotify } from "../../app/providers/NotificationProvider";
import { useI18n } from "../../i18n/I18nProvider";
import { formatRelative } from "../../lib/dates";
import { getErrorMessage } from "../../lib/errors";
import { stripFormatting } from "../../lib/formatting";
import type { AppNotification } from "../../types";
import { useNotifications } from "./NotificationsProvider";
import {
  markAllAsRead,
  markAsRead,
  removeAll,
  removeNotification,
} from "./notificationsService";

function NotificationRow({
  item,
  onOpen,
  onRemove,
}: {
  item: AppNotification;
  onOpen: (item: AppNotification) => void;
  onRemove: (item: AppNotification) => void;
}) {
  const { t, locale } = useI18n();
  const Icon = item.scheduled
    ? ScheduleSendOutlinedIcon
    : CheckCircleOutlineIcon;
  const preview = stripFormatting(item.bodyPreview);

  return (
    <li
      className={`flex items-start gap-1 border-b border-line last:border-b-0 ${item.read ? "" : "bg-brand-soft/60"}`}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 px-4 py-3 text-left hover:bg-surface-hover"
        onClick={() => onOpen(item)}
      >
        <span
          className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${item.scheduled ? "bg-info-soft text-info" : "bg-success-soft text-success"}`}
        >
          <Icon fontSize="small" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-bold">
              {item.scheduled
                ? t("notifications.sentScheduled")
                : t("notifications.sentNow")}
            </span>
            {!item.read && (
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-brand"
                aria-hidden="true"
              />
            )}
          </span>
          <span className="block text-xs text-subtle">
            {t("notifications.detail", {
              count: item.recipientCount,
              connection: item.connectionName || "—",
            })}
          </span>
          {preview && (
            <span className="mt-0.5 block truncate text-xs text-muted">
              {preview}
            </span>
          )}
          <span className="mt-0.5 block text-[11px] text-muted">
            {formatRelative(item.createdAt.toDate(), locale)}
          </span>
        </span>
      </button>
      <Tooltip title={t("notifications.dismiss")}>
        <IconButton
          size="small"
          sx={{ mt: 1, mr: 1 }}
          aria-label={t("notifications.dismiss")}
          onClick={() => onRemove(item)}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </li>
  );
}

/** Sino do cabeçalho: contador de não lidas e lista das últimas notificações. */
export function NotificationBell() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const notify = useNotify();
  const { notifications, unread } = useNotifications();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
    } catch (cause) {
      notify.error(getErrorMessage(cause, t));
    }
  };

  const open = (item: AppNotification) => {
    setAnchor(null);
    if (!item.read) void run(() => markAsRead(item.id));
    navigate(`/broadcasts?connection=${item.connectionId}`);
  };

  const label =
    unread > 0
      ? t("notifications.openUnread", { count: unread })
      : t("notifications.open");

  return (
    <>
      <Tooltip title={t("notifications.title")}>
        <IconButton
          aria-label={label}
          onClick={(event) => setAnchor(event.currentTarget)}
          sx={{ width: 40, height: 40 }}
        >
          <Badge badgeContent={unread} color="primary" max={9}>
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { width: { xs: "calc(100vw - 24px)", sm: 380 }, mt: 1 },
          },
        }}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <h2 className="font-display text-base font-extrabold">
            {t("notifications.title")}
          </h2>
          {unread > 0 && (
            <Button
              size="small"
              onClick={() =>
                run(() =>
                  markAllAsRead(
                    notifications
                      .filter((item) => !item.read)
                      .map((item) => item.id),
                  ),
                )
              }
            >
              {t("notifications.markAll")}
            </Button>
          )}
        </div>
        <Divider />
        {notifications.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <NotificationsNoneIcon sx={{ fontSize: 36 }} color="disabled" />
            <p className="mt-2 text-sm font-bold">{t("notifications.empty")}</p>
            <p className="mt-1 text-xs text-muted">
              {t("notifications.emptyHint")}
            </p>
          </div>
        ) : (
          <>
            {/* A lista rola dentro do painel, que nunca passa da altura da tela. */}
            <ul className="max-h-[min(60vh,26rem)] overflow-y-auto overscroll-contain">
              {notifications.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onOpen={open}
                  onRemove={(target) =>
                    run(() => removeNotification(target.id))
                  }
                />
              ))}
            </ul>
            <Divider />
            <div className="flex justify-end px-3 py-2">
              <Button
                size="small"
                color="inherit"
                onClick={() =>
                  run(() => removeAll(notifications.map((item) => item.id)))
                }
              >
                {t("notifications.clear")}
              </Button>
            </div>
          </>
        )}
      </Popover>
    </>
  );
}
