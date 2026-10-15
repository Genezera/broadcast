// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageToggle } from "../components/ui/LanguageToggle";
import { I18nProvider, useI18n } from "./I18nProvider";

function Sample() {
  const { t } = useI18n();
  return <p data-testid="text">{t("common.cancel")}</p>;
}

const setup = () =>
  render(
    <I18nProvider>
      <LanguageToggle />
      <Sample />
    </I18nProvider>,
  );

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("I18nProvider", () => {
  it("falls back to Portuguese without a provider", () => {
    render(<Sample />);
    expect(screen.getByTestId("text").textContent).toBe("Cancelar");
  });

  it("starts from the saved language", () => {
    localStorage.setItem("broadcast:lang", "en");
    setup();
    expect(screen.getByTestId("text").textContent).toBe("Cancel");
    expect(document.documentElement.lang).toBe("en-US");
  });

  it("switches language from the toggle, keeps the choice and updates <html lang>", async () => {
    localStorage.setItem("broadcast:lang", "pt");
    setup();
    expect(screen.getByTestId("text").textContent).toBe("Cancelar");

    const english = screen.getAllByRole("button", { pressed: false })[0];
    await userEvent.click(english);

    expect(screen.getByTestId("text").textContent).toBe("Cancel");
    expect(localStorage.getItem("broadcast:lang")).toBe("en");
    expect(document.documentElement.lang).toBe("en-US");
    expect(
      screen.getAllByRole("button", { pressed: true })[0].textContent,
    ).toBe("EN");
  });

  it("marks the active language as pressed", () => {
    localStorage.setItem("broadcast:lang", "pt");
    setup();
    expect(
      screen.getAllByRole("button", { pressed: true })[0].textContent,
    ).toBe("PT");
  });
});
