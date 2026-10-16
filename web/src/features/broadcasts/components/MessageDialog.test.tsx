// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Connection, Contact, Message } from "../../../types";

// Os serviços falam com o Firebase e o calendário é pesado: aqui só interessa
// o comportamento do diálogo (validação, alcance, envio e edição).
vi.mock("../services/messagesService", () => ({
  createMessage: vi.fn(),
  updateMessage: vi.fn(),
}));
vi.mock("../../auth/AuthProvider", () => ({
  useCurrentUser: () => ({ uid: "u1" }),
}));
vi.mock("./ScheduleField", () => ({
  default: ({
    value,
    onChange,
    error,
  }: {
    value: string;
    onChange: (value: string) => void;
    error?: string;
  }) => (
    <div>
      <input
        aria-label="Data e horário"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <p>{error}</p>}
    </div>
  ),
}));

const contactsByConnection: Record<string, Contact[]> = {
  c1: [
    { id: "a1", name: "Ana", phone: "+55 11 90000-0001" },
    { id: "a2", name: "Bruno", phone: "+55 11 90000-0002" },
  ] as Contact[],
  c2: [{ id: "b1", name: "Carla", phone: "+55 21 98888-0001" }] as Contact[],
};
vi.mock("../../contacts/hooks/useContacts", () => ({
  useContacts: (_uid: string, connectionId: string) => ({
    contacts: contactsByConnection[connectionId] ?? [],
    loading: false,
    error: "",
  }),
}));

import { NotificationProvider } from "../../../app/providers/NotificationProvider";
import { createMessage, updateMessage } from "../services/messagesService";
import { MessageDialog } from "./MessageDialog";

const connections = [
  { id: "c1", name: "Loja Centro" },
  { id: "c2", name: "Loja Norte" },
] as Connection[];

const stamp = (date: Date) => ({ toDate: () => date }) as never;

const message = (overrides: Partial<Message> = {}): Message =>
  ({
    id: "m1",
    tenantId: "u1",
    connectionId: "c1",
    body: "Texto antigo",
    contactIds: ["a1"],
    recipients: [{ id: "a1", name: "Ana", phone: "+55 11 90000-0001" }],
    status: "sent",
    scheduledAt: null,
    sentAt: stamp(new Date("2026-10-15T12:00:00Z")),
    createdAt: stamp(new Date("2026-10-15T12:00:00Z")),
    updatedAt: stamp(new Date("2026-10-15T12:00:00Z")),
    ...overrides,
  }) as Message;

const onClose = vi.fn();

const renderDialog = (
  target: Message | "new" = "new",
  defaultConnectionId?: string,
) =>
  render(
    <NotificationProvider>
      <MessageDialog
        target={target}
        connections={connections}
        defaultConnectionId={defaultConnectionId}
        onClose={onClose}
      />
    </NotificationProvider>,
  );

const editor = () => screen.getByRole("textbox", { name: "Mensagem" });
const typeMessage = async (text: string) => {
  await waitFor(() =>
    expect(editor().getAttribute("contenteditable")).toBe("true"),
  );
  await userEvent.click(editor());
  await userEvent.keyboard(text);
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createMessage).mockResolvedValue({
    data: { id: "m1", ids: ["m1"], connectionCount: 1, recipientCount: 1 },
  } as never);
  vi.mocked(updateMessage).mockResolvedValue({} as never);
});
afterEach(cleanup);

describe("MessageDialog — new message", () => {
  it("asks for recipients and a message before sending", async () => {
    renderDialog();
    await userEvent.click(
      await screen.findByRole("button", { name: "Enviar agora" }),
    );
    expect(
      await screen.findByText("Selecione pelo menos um contato."),
    ).toBeTruthy();
    expect(screen.getByText("Escreva a mensagem.")).toBeTruthy();
    expect(createMessage).not.toHaveBeenCalled();
  });

  it("sends to the chosen contacts of the chosen connection", async () => {
    renderDialog();
    await userEvent.click(
      await screen.findByRole("checkbox", { name: /Bruno/ }),
    );
    await typeMessage("Olá, tudo bem?");
    await userEvent.click(screen.getByRole("button", { name: "Enviar agora" }));

    await waitFor(() => expect(createMessage).toHaveBeenCalledTimes(1));
    expect(createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        audience: "contacts",
        connectionId: "c1",
        contactIds: ["a2"],
        body: "Olá, tudo bem?",
        mode: "now",
      }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(
      await screen.findByText("Mensagem enviada para 1 contato."),
    ).toBeTruthy();
  });

  it("starts on the connection suggested by the page filter", async () => {
    renderDialog("new", "c2");
    expect(await screen.findByRole("checkbox", { name: /Carla/ })).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: /Ana/ })).toBeNull();
  });

  it("clears the selected contacts when the connection changes", async () => {
    renderDialog();
    await userEvent.click(await screen.findByRole("checkbox", { name: /Ana/ }));
    expect(screen.getByText("(1 selecionado)")).toBeTruthy();

    await userEvent.click(screen.getByRole("combobox", { name: "Conexão" }));
    await userEvent.click(
      await screen.findByRole("option", { name: "Loja Norte" }),
    );

    expect(await screen.findByRole("checkbox", { name: /Carla/ })).toBeTruthy();
    expect(screen.getByText("(0 selecionado)")).toBeTruthy();
  });

  it("finds a contact by name or phone with the search box", async () => {
    renderDialog();
    await userEvent.type(
      await screen.findByLabelText("Buscar por nome ou telefone"),
      "bru",
    );
    expect(screen.getByRole("checkbox", { name: /Bruno/ })).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: /Ana/ })).toBeNull();
  });

  it("sends to every contact of the chosen connections", async () => {
    vi.mocked(createMessage).mockResolvedValue({
      data: {
        id: "m1",
        ids: ["m1", "m2"],
        connectionCount: 2,
        recipientCount: 3,
      },
    } as never);
    renderDialog();
    await userEvent.click(
      await screen.findByRole("button", { name: "Conexões" }),
    );
    await userEvent.click(await screen.findByText("Selecionar todos"));
    await typeMessage("Aviso geral");
    await userEvent.click(screen.getByRole("button", { name: "Enviar agora" }));

    await waitFor(() => expect(createMessage).toHaveBeenCalledTimes(1));
    expect(createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        audience: "connections",
        connectionIds: expect.arrayContaining(["c1", "c2"]),
        body: "Aviso geral",
      }),
    );
    expect(
      await screen.findByText("Enviada para 3 contatos em 2 conexões."),
    ).toBeTruthy();
  });

  it("requires a connection when sending to connections", async () => {
    renderDialog();
    await userEvent.click(
      await screen.findByRole("button", { name: "Conexões" }),
    );
    // A conexão sugerida vem marcada; desmarco para testar a validação.
    await userEvent.click(
      await screen.findByRole("checkbox", { name: /Loja Centro/ }),
    );
    await typeMessage("Oi");
    await userEvent.click(screen.getByRole("button", { name: "Enviar agora" }));
    expect(
      await screen.findByText("Selecione pelo menos uma conexão."),
    ).toBeTruthy();
    expect(createMessage).not.toHaveBeenCalled();
  });

  it("schedules only with a date and sends it as an absolute time", async () => {
    renderDialog();
    await userEvent.click(await screen.findByRole("checkbox", { name: /Ana/ }));
    await typeMessage("Lembrete");
    await userEvent.click(screen.getByRole("radio", { name: "Agendar" }));
    await userEvent.click(screen.getByRole("button", { name: "Agendar" }));
    expect(
      await screen.findByText("Informe a data e o horário do envio."),
    ).toBeTruthy();
    expect(createMessage).not.toHaveBeenCalled();

    const future = new Date(Date.now() + 2 * 3_600_000);
    const local = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}T${String(future.getHours()).padStart(2, "0")}:${String(future.getMinutes()).padStart(2, "0")}`;
    fireEvent.change(await screen.findByLabelText("Data e horário"), {
      target: { value: local },
    });
    await userEvent.click(screen.getByRole("button", { name: "Agendar" }));

    await waitFor(() => expect(createMessage).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(createMessage).mock.calls[0][0];
    expect(payload.mode).toBe("scheduled");
    expect(payload.scheduledAt).toBe(local);
    expect(await screen.findByText("Mensagem agendada.")).toBeTruthy();
  });

  it("refuses a date in the past", async () => {
    renderDialog();
    await userEvent.click(await screen.findByRole("checkbox", { name: /Ana/ }));
    await typeMessage("Atrasada");
    await userEvent.click(screen.getByRole("radio", { name: "Agendar" }));
    fireEvent.change(await screen.findByLabelText("Data e horário"), {
      target: { value: "2020-01-01T10:00" },
    });
    await userEvent.click(screen.getByRole("button", { name: "Agendar" }));
    expect(
      await screen.findByText("Escolha uma data e um horário futuros."),
    ).toBeTruthy();
    expect(createMessage).not.toHaveBeenCalled();
  });

  it("shows the server error and stays open when sending fails", async () => {
    vi.mocked(createMessage).mockRejectedValue({
      code: "functions/not-found",
      message: "x",
      details: { key: "connectionNotFound" },
    });
    renderDialog();
    await userEvent.click(await screen.findByRole("checkbox", { name: /Ana/ }));
    await typeMessage("Oi");
    await userEvent.click(screen.getByRole("button", { name: "Enviar agora" }));
    expect(await screen.findByText("Conexão não encontrada.")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("MessageDialog — editing", () => {
  it("opens with the message, without the audience choice", async () => {
    renderDialog(message());
    expect(await screen.findByText("Editar mensagem")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Conexões" })).toBeNull();
    expect(screen.getByText("Loja Centro")).toBeTruthy();
    await waitFor(() => expect(editor().textContent).toBe("Texto antigo"));
    expect(
      screen.getByRole("checkbox", { name: /Ana/ }).hasAttribute("checked") ||
        (screen.getByRole("checkbox", { name: /Ana/ }) as HTMLInputElement)
          .checked,
    ).toBe(true);
  });

  it("saves the changes of a sent message without offering to reschedule", async () => {
    renderDialog(message());
    await waitFor(() => expect(editor().textContent).toBe("Texto antigo"));
    await userEvent.click(editor());
    expect(
      screen.getByRole("radio", { name: "Agendar" }).hasAttribute("disabled"),
    ).toBe(true);
    await userEvent.click(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );

    await waitFor(() => expect(updateMessage).toHaveBeenCalledTimes(1));
    expect(updateMessage).toHaveBeenCalledWith(
      "m1",
      expect.objectContaining({
        body: "Texto antigo",
        contactIds: ["a1"],
      }),
    );
    expect(createMessage).not.toHaveBeenCalled();
  });

  it("lets a scheduled message whose time just passed be saved with the same date", async () => {
    const justPassed = new Date(Date.now() - 30_000);
    renderDialog(
      message({
        status: "scheduled",
        sentAt: null,
        scheduledAt: stamp(justPassed),
      }),
    );
    await waitFor(() => expect(editor().textContent).toBe("Texto antigo"));
    await userEvent.click(editor());
    await userEvent.click(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );

    await waitFor(() => expect(updateMessage).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByText("Escolha uma data e um horário futuros."),
    ).toBeNull();
    expect(vi.mocked(updateMessage).mock.calls[0][1]).toMatchObject({
      mode: "scheduled",
      body: "Texto antigo",
    });
  });

  it("still refuses to move a scheduled message to a past date", async () => {
    renderDialog(
      message({
        status: "scheduled",
        sentAt: null,
        scheduledAt: stamp(new Date(Date.now() + 3_600_000)),
      }),
    );
    await waitFor(() => expect(editor().textContent).toBe("Texto antigo"));
    fireEvent.change(await screen.findByLabelText("Data e horário"), {
      target: { value: "2020-01-01T10:00" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );
    expect(
      await screen.findByText("Escolha uma data e um horário futuros."),
    ).toBeTruthy();
    expect(updateMessage).not.toHaveBeenCalled();
  });
});
