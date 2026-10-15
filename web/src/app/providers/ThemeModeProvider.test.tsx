// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { ThemeModeProvider } from "./ThemeModeProvider";

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});
afterEach(cleanup);

const renderToggle = () =>
  render(
    <ThemeModeProvider>
      <ThemeToggle />
    </ThemeModeProvider>,
  );

describe("ThemeModeProvider", () => {
  it("starts in light mode when nothing is saved", () => {
    renderToggle();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(
      screen.getByRole("button", { name: "Ativar modo escuro" }),
    ).toBeTruthy();
  });

  it("toggles the theme, updates <html> and remembers the choice", async () => {
    renderToggle();
    await userEvent.click(
      screen.getByRole("button", { name: "Ativar modo escuro" }),
    );
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("broadcast:theme")).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Ativar modo claro" }),
    ).toBeTruthy();

    await userEvent.click(
      screen.getByRole("button", { name: "Ativar modo claro" }),
    );
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("broadcast:theme")).toBe("light");
  });

  it("restores the saved theme on load", () => {
    localStorage.setItem("broadcast:theme", "dark");
    renderToggle();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });
});
