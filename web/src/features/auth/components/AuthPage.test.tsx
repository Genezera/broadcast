// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// O serviço real inicializa o Firebase; aqui só interessa o comportamento da tela.
vi.mock("../authService", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  requestPasswordReset: vi.fn(),
}));

import { requestPasswordReset, signIn, signUp } from "../authService";
import { ThemeModeProvider } from "../../../app/providers/ThemeModeProvider";
import { AuthPage } from "./AuthPage";

// A tela inclui o botão de tema, que depende do provider.
const renderPage = () =>
  render(
    <ThemeModeProvider>
      <AuthPage />
    </ThemeModeProvider>,
  );

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

const email = () => screen.getByLabelText("E-mail");
const password = () => screen.getByLabelText("Senha");

describe("AuthPage", () => {
  it("validates the fields before calling Firebase", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText("Informe o e-mail.")).toBeTruthy();
    expect(screen.getByText("Informe a senha.")).toBeTruthy();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("signs in with the typed credentials", async () => {
    renderPage();
    await userEvent.type(email(), "ana@exemplo.com");
    await userEvent.type(password(), "segredo123");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith("ana@exemplo.com", "segredo123"),
    );
  });

  it("requires six characters only when registering", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Cadastre-se" }));
    await userEvent.type(screen.getByLabelText("Nome"), "Ana Souza");
    await userEvent.type(email(), "ana@exemplo.com");
    await userEvent.type(password(), "123");
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));
    expect(
      await screen.findAllByText("A senha deve ter pelo menos 6 caracteres."),
    ).not.toHaveLength(0);
    expect(signUp).not.toHaveBeenCalled();
  });

  it("sends the password reset link without revealing if the account exists", async () => {
    renderPage();
    await userEvent.click(screen.getByText("Esqueci minha senha"));
    expect(await screen.findByText("Informe o e-mail.")).toBeTruthy();
    expect(requestPasswordReset).not.toHaveBeenCalled();

    await userEvent.type(email(), "ana@");
    await userEvent.click(screen.getByText("Esqueci minha senha"));
    expect(await screen.findByText("Digite um e-mail válido.")).toBeTruthy();
    expect(requestPasswordReset).not.toHaveBeenCalled();

    await userEvent.type(email(), "exemplo.com");
    await userEvent.click(screen.getByText("Esqueci minha senha"));
    await waitFor(() =>
      expect(requestPasswordReset).toHaveBeenCalledWith("ana@exemplo.com"),
    );
    expect(
      await screen.findByText(/Se o e-mail estiver cadastrado/),
    ).toBeTruthy();
  });
});
