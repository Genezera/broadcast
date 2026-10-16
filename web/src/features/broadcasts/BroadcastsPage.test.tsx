// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { Connection, Message } from "../../types";

// A tela depende do Firestore (listas, contagens) e do Firebase Functions: aqui
// as peças de dados são trocadas por dados fixos para testar só o comportamento.
const messagesState = vi.hoisted(() => ({
  messages: [] as unknown[],
  loading: false,
  error: "",
}));
const useMessagesMock = vi.hoisted(() => vi.fn());
vi.mock("./hooks/useMessages", () => ({
  useMessages: (...args: unknown[]) => {
    useMessagesMock(...args);
    return messagesState;
  },
}));
vi.mock("./hooks/useMessageCounts", () => ({
  useMessageCounts: () => ({ all: 3, sent: 2, scheduled: 1 }),
}));
vi.mock("./services/messagesService", () => ({
  deleteMessage: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../auth/AuthProvider", () => ({
  useCurrentUser: () => ({ uid: "u1" }),
}));
const connectionsState = vi.hoisted(() => ({
  connections: [] as unknown[],
  activeConnections: [] as unknown[],
  loading: false,
  error: "",
}));
vi.mock("../connections/ConnectionsProvider", () => ({
  useConnectionsContext: () => connectionsState,
}));
// O diálogo de criação/edição tem testes próprios; aqui só vejo se abre.
vi.mock("./components/MessageDialog", () => ({
  MessageDialog: ({
    target,
    defaultConnectionId,
  }: {
    target: Message | "new" | null;
    defaultConnectionId?: string;
  }) =>
    target ? (
      <div role="dialog" aria-label="dialogo-de-mensagem">
        {target === "new" ? "nova" : `editar ${target.id}`}
        {defaultConnectionId ? ` em ${defaultConnectionId}` : ""}
      </div>
    ) : null,
}));

import { NotificationProvider } from "../../app/providers/NotificationProvider";
import { BroadcastsPage } from "./BroadcastsPage";
import { deleteMessage } from "./services/messagesService";

const connection = (id: string, name: string, status = "active") =>
  ({ id, name, status }) as Connection;
const stamp = (iso: string) => ({ toDate: () => new Date(iso) }) as never;

const recipients = Array.from({ length: 8 }, (_, i) => ({
  id: `r${i}`,
  name: `Contato ${i + 1}`,
  phone: `+55 11 9000${i}-000${i}`,
}));

const make = (id: string, overrides: Partial<Message> = {}): Message =>
  ({
    id,
    tenantId: "u1",
    connectionId: "c1",
    body: `Texto da mensagem ${id}`,
    contactIds: recipients.map((item) => item.id),
    recipients,
    status: "sent",
    scheduledAt: null,
    sentAt: stamp("2026-10-15T12:00:00Z"),
    createdAt: stamp("2026-10-15T12:00:00Z"),
    updatedAt: stamp("2026-10-15T12:00:00Z"),
    ...overrides,
  }) as Message;

function Where() {
  const location = useLocation();
  return <output data-testid="where">{location.search}</output>;
}

const renderPage = (search = "") =>
  render(
    <NotificationProvider>
      <MemoryRouter initialEntries={[`/broadcasts${search}`]}>
        <BroadcastsPage />
        <Where />
      </MemoryRouter>
    </NotificationProvider>,
  );

const lastQuery = () =>
  useMessagesMock.mock.calls[useMessagesMock.mock.calls.length - 1][1] as {
    connectionId?: string;
    status?: string;
  };

beforeEach(() => {
  vi.clearAllMocks();
  const list = [
    connection("c1", "Loja Centro"),
    connection("c2", "Loja Norte"),
  ];
  connectionsState.connections = list;
  connectionsState.activeConnections = list;
  connectionsState.loading = false;
  messagesState.loading = false;
  messagesState.error = "";
  messagesState.messages = [
    make("m1"),
    make("m2", { connectionId: "c2", body: "Promoção de *hoje*" }),
    make("m3", {
      status: "scheduled",
      sentAt: null,
      scheduledAt: stamp("2026-10-20T15:00:00Z"),
    }),
  ];
});
afterEach(cleanup);

describe("BroadcastsPage", () => {
  it("guides the customer to create a connection first", () => {
    connectionsState.connections = [];
    connectionsState.activeConnections = [];
    renderPage();
    expect(screen.getByText("Crie uma conexão primeiro")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ir para conexões" })).toBeTruthy();
  });

  it("lists the messages of every connection, showing which connection each came from", () => {
    renderPage();
    expect(lastQuery()).toMatchObject({
      connectionId: undefined,
      status: undefined,
    });
    expect(screen.getByText("Texto da mensagem m1")).toBeTruthy();
    expect(
      screen.getAllByText("Loja Centro", { selector: ".MuiChip-label" }),
    ).toHaveLength(2);
    expect(
      screen.getAllByText("Loja Norte", { selector: ".MuiChip-label" }),
    ).toHaveLength(1);
    expect(screen.getByText("3 mensagens no total")).toBeTruthy();
  });

  it("shows the formatted text of a message", () => {
    renderPage();
    expect(screen.getByText("hoje").tagName).toBe("STRONG");
  });

  it("filters by connection and keeps the choice in the URL", async () => {
    renderPage();
    await userEvent.click(
      screen.getByRole("combobox", { name: "Filtrar mensagens por conexão" }),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "Loja Norte" }),
    );

    expect(screen.getByTestId("where").textContent).toBe("?connection=c2");
    expect(lastQuery().connectionId).toBe("c2");
    // Numa conexão só, o nome dela não se repete em cada item.
    expect(
      screen.queryByText("Loja Norte", { selector: ".MuiChip-label" }),
    ).toBeNull();
  });

  it("starts filtered when the URL names one of the customer's connections", () => {
    renderPage("?connection=c1");
    expect(lastQuery().connectionId).toBe("c1");
  });

  it("ignores a connection id that is not the customer's", () => {
    renderPage("?connection=de-outro-cliente");
    expect(lastQuery().connectionId).toBeUndefined();
  });

  it("filters by status", async () => {
    renderPage();
    await userEvent.click(
      screen.getByRole("button", { name: "Agendadas (1)" }),
    );
    expect(lastQuery().status).toBe("scheduled");
    await userEvent.click(screen.getByRole("button", { name: "Enviadas (2)" }));
    expect(lastQuery().status).toBe("sent");
    await userEvent.click(screen.getByRole("button", { name: "Todas (3)" }));
    expect(lastQuery().status).toBeUndefined();
  });

  it("marks a message the scheduler gave up on as failed", () => {
    messagesState.messages = [
      make("m9", {
        status: "failed",
        sentAt: null,
        scheduledAt: stamp("2026-10-20T15:00:00Z"),
      }),
    ];
    renderPage();
    expect(screen.getByText("Falhou")).toBeTruthy();
  });

  it("opens the full message with every recipient and a search", async () => {
    renderPage();
    await userEvent.click(
      screen.getAllByRole("button", { name: "Ver detalhes" })[0],
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Detalhes da mensagem",
    });
    expect(within(dialog).getByText("Texto da mensagem m1")).toBeTruthy();
    expect(within(dialog).getByText("8 destinatários")).toBeTruthy();
    expect(within(dialog).getByText("Contato 1")).toBeTruthy();
    expect(within(dialog).getByText("Contato 8")).toBeTruthy();

    await userEvent.type(
      within(dialog).getByLabelText("Buscar por nome ou telefone"),
      "contato 7",
    );
    expect(within(dialog).getByText("Contato 7")).toBeTruthy();
    expect(within(dialog).queryByText("Contato 1")).toBeNull();
  });

  it("hands the message to the edit dialog from the details", async () => {
    renderPage();
    await userEvent.click(
      screen.getAllByRole("button", { name: "Ver detalhes" })[0],
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Detalhes da mensagem",
    });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Editar" }),
    );
    expect(
      await screen.findByRole("dialog", { name: "dialogo-de-mensagem" }),
    ).toBeTruthy();
    expect(screen.getByText("editar m1")).toBeTruthy();
  });

  it("opens the new-message dialog suggesting the filtered connection", async () => {
    renderPage("?connection=c2");
    await userEvent.click(
      screen.getByRole("button", { name: "Nova mensagem" }),
    );
    expect(await screen.findByText("nova em c2")).toBeTruthy();
  });

  it("does not offer a new message without an active connection", () => {
    connectionsState.activeConnections = [];
    renderPage();
    expect(
      (
        screen.getByRole("button", {
          name: "Nova mensagem",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("deletes a message only after the customer confirms", async () => {
    renderPage();
    await userEvent.click(
      screen.getAllByRole("button", { name: "Excluir mensagem" })[0],
    );
    const dialog = await screen.findByRole("dialog", {
      name: "Excluir mensagem",
    });
    expect(deleteMessage).not.toHaveBeenCalled();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Excluir" }),
    );
    await waitFor(() => expect(deleteMessage).toHaveBeenCalledWith("m1"));
    expect(await screen.findByText("Mensagem excluída.")).toBeTruthy();
  });

  it("warns that deleting a scheduled message cancels the sending", async () => {
    renderPage();
    const deleteButtons = screen.getAllByRole("button", {
      name: "Excluir mensagem",
    });
    await userEvent.click(deleteButtons[2]);
    expect(
      await screen.findByText(
        "Esta mensagem está agendada e não será enviada se for excluída.",
      ),
    ).toBeTruthy();
  });

  it("shows the empty state and the load error", () => {
    messagesState.messages = [];
    messagesState.error = "Sem permissão";
    renderPage();
    expect(screen.getByText("Nenhuma mensagem criada")).toBeTruthy();
    expect(screen.getByText("Sem permissão")).toBeTruthy();
  });
});
