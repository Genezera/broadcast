// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { I18nProvider } from "../../i18n/I18nProvider";
import { HelpAssistant } from "./HelpAssistant";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function Where() {
  return <output data-testid="where">{useLocation().pathname}</output>;
}

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <HelpAssistant />
      <Where />
    </MemoryRouter>,
  );

const open = () =>
  userEvent.click(screen.getByRole("button", { name: "Abrir ajuda" }));

describe("HelpAssistant", () => {
  it("opens with a greeting and highlights the topic of the current screen", async () => {
    renderAt("/connections/abc/contacts");
    await open();
    expect(
      await screen.findByText(/Eu sou o assistente do Broadcast/),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Esta tela: Contatos" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Agendar uma mensagem" }),
    ).toBeTruthy();
  });

  it("answers with steps after a button is chosen", async () => {
    renderAt("/");
    await open();
    await userEvent.click(
      await screen.findByRole("button", { name: "Agendar uma mensagem" }),
    );
    // O usuário vê a própria escolha e, em seguida, a resposta passo a passo.
    expect(
      await screen.findByText(
        /Informe uma data e um horário futuros/,
        {},
        { timeout: 3000 },
      ),
    ).toBeTruthy();
    expect(screen.getByText(/pode levar até 1 minuto/)).toBeTruthy();
    // Os botões seguintes aparecem e dá para voltar ao início.
    expect(screen.getByRole("button", { name: "Menu principal" })).toBeTruthy();
  });

  it("runs the suggested action and closes the panel", async () => {
    renderAt("/");
    await open();
    await userEvent.click(
      await screen.findByRole("button", { name: "Enviar uma mensagem" }),
    );
    await userEvent.click(
      await screen.findByRole(
        "button",
        { name: "Ir para Broadcast" },
        { timeout: 3000 },
      ),
    );
    expect(screen.getByTestId("where").textContent).toBe("/broadcasts");
  });

  it("lists the frequently asked questions in the second tab", async () => {
    renderAt("/");
    await open();
    await userEvent.click(
      await screen.findByRole("tab", { name: "Perguntas frequentes" }),
    );
    expect(
      await screen.findByText("O envio de mensagens é real?"),
    ).toBeTruthy();
    await userEvent.click(screen.getByText("O envio de mensagens é real?"));
    expect(await screen.findByText(/apenas uma simulação/)).toBeTruthy();
  });

  it("answers in English when that is the chosen language", async () => {
    localStorage.setItem("broadcast:lang", "en");
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/connections/abc/contacts"]}>
          <HelpAssistant />
        </MemoryRouter>
      </I18nProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open help" }));
    expect(await screen.findByText(/I.m the Broadcast assistant/)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "This screen: Contacts" }),
    ).toBeTruthy();
    await userEvent.click(
      screen.getByRole("button", { name: "Schedule a message" }),
    );
    expect(
      await screen.findByText(
        /Enter a future date and time/,
        {},
        { timeout: 3000 },
      ),
    ).toBeTruthy();
  });
});
