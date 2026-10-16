// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { AppNotification } from "../../types";

// Os serviços falam com o Firestore; aqui só interessa o comportamento do sino.
vi.mock("./notificationsService", () => ({
  markAsRead: vi.fn().mockResolvedValue(undefined),
  markAllAsRead: vi.fn().mockResolvedValue(undefined),
  removeNotification: vi.fn().mockResolvedValue(undefined),
  removeAll: vi.fn().mockResolvedValue(undefined),
}));

const state: { notifications: AppNotification[]; unread: number } = {
  notifications: [],
  unread: 0,
};
vi.mock("./NotificationsProvider", () => ({
  useNotifications: () => state,
}));

import { NotificationProvider } from "../../app/providers/NotificationProvider";
import { NotificationBell } from "./NotificationBell";
import {
  markAllAsRead,
  markAsRead,
  removeAll,
  removeNotification,
} from "./notificationsService";

const make = (
  id: string,
  overrides: Partial<AppNotification> = {},
): AppNotification => ({
  id,
  tenantId: "t",
  type: "message_sent",
  messageId: id,
  connectionId: "loja-1",
  connectionName: "Loja Centro",
  recipientCount: 3,
  scheduled: false,
  bodyPreview: "Olá *pessoal*",
  read: false,
  createdAt: { toDate: () => new Date(Date.now() - 120_000) } as never,
  ...overrides,
});

function Where() {
  const location = useLocation();
  return (
    <output data-testid="where">{location.pathname + location.search}</output>
  );
}

const setup = (notifications: AppNotification[]) => {
  state.notifications = notifications;
  state.unread = notifications.filter((item) => !item.read).length;
  render(
    <NotificationProvider>
      <MemoryRouter>
        <NotificationBell />
        <Where />
      </MemoryRouter>
    </NotificationProvider>,
  );
};

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("NotificationBell", () => {
  it("shows how many notifications are unread on the bell", () => {
    setup([make("a"), make("b", { read: true })]);
    expect(
      screen.getByRole("button", { name: "Abrir notificações (1 nova)" }),
    ).toBeTruthy();
  });

  it("explains the empty state", async () => {
    setup([]);
    await userEvent.click(
      screen.getByRole("button", { name: "Abrir notificações" }),
    );
    expect(
      await screen.findByText("Nenhuma notificação por enquanto."),
    ).toBeTruthy();
  });

  it("describes sent and scheduled messages, with the plain preview", async () => {
    setup([make("a"), make("b", { scheduled: true, recipientCount: 1 })]);
    await userEvent.click(
      screen.getByRole("button", { name: /Abrir notificações/ }),
    );
    expect(await screen.findByText("Mensagem enviada")).toBeTruthy();
    expect(screen.getByText("Mensagem agendada enviada")).toBeTruthy();
    expect(screen.getByText("3 contatos · Loja Centro")).toBeTruthy();
    expect(screen.getByText("1 contato · Loja Centro")).toBeTruthy();
    // Os marcadores de formatação não aparecem na prévia.
    expect(screen.getAllByText("Olá pessoal")).toHaveLength(2);
  });

  it("opens the connection of a notification and marks it as read", async () => {
    setup([make("a")]);
    await userEvent.click(
      screen.getByRole("button", { name: /Abrir notificações/ }),
    );
    await userEvent.click(await screen.findByText("Mensagem enviada"));
    expect(markAsRead).toHaveBeenCalledWith("a");
    expect(screen.getByTestId("where").textContent).toBe(
      "/broadcasts?connection=loja-1",
    );
  });

  it("marks everything as read, removes one and clears all", async () => {
    setup([make("a"), make("b")]);
    await userEvent.click(
      screen.getByRole("button", { name: /Abrir notificações/ }),
    );
    await userEvent.click(await screen.findByText("Marcar todas como lidas"));
    expect(markAllAsRead).toHaveBeenCalledWith(["a", "b"]);

    await userEvent.click(screen.getAllByLabelText("Remover notificação")[0]);
    expect(removeNotification).toHaveBeenCalledWith("a");

    await userEvent.click(screen.getByText("Limpar tudo"));
    expect(removeAll).toHaveBeenCalledWith(["a", "b"]);
  });
});
