// @vitest-environment jsdom
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageEditor } from "./MessageEditor";

afterEach(cleanup);

function Harness({
  initial = "",
  onValue,
}: {
  initial?: string;
  onValue?: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <MessageEditor
      value={value}
      onChange={(next) => {
        setValue(next);
        onValue?.(next);
      }}
      maxLength={200}
    />
  );
}

const field = () => screen.getByRole("textbox", { name: "Mensagem" });

describe("MessageEditor", () => {
  it("shows the saved markers as styled text, with no markers on screen", async () => {
    render(
      <Harness initial="Olá *forte*, _torto_, ++sublinhado++ e ~riscado~" />,
    );
    await waitFor(() => expect(field().querySelector("strong")).toBeTruthy());
    expect(field().querySelector("strong")?.textContent).toBe("forte");
    expect(field().querySelector("em")?.textContent).toBe("torto");
    expect(field().querySelector("u")?.textContent).toBe("sublinhado");
    expect(field().querySelector("s")?.textContent).toBe("riscado");
    // O que aparece é o texto limpo, sem asteriscos nem prévia separada.
    expect(field().textContent).toBe("Olá forte, torto, sublinhado e riscado");
    expect(screen.queryByText("Prévia")).toBeNull();
  });

  it("has a toolbar with the four styles", async () => {
    render(<Harness />);
    for (const name of ["Negrito", "Itálico", "Sublinhado", "Riscado"]) {
      expect(await screen.findByRole("button", { name })).toBeTruthy();
    }
  });

  it("reports typed text as the stored value", async () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);
    await waitFor(() =>
      expect(field().getAttribute("contenteditable")).toBe("true"),
    );
    await userEvent.click(field());
    await userEvent.keyboard("Oi pessoal");
    await waitFor(() => expect(onValue).toHaveBeenLastCalledWith("Oi pessoal"));
  });

  it("applies italic live from the toolbar and stores it with markers", async () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);
    await waitFor(() =>
      expect(field().getAttribute("contenteditable")).toBe("true"),
    );
    await userEvent.click(field());
    // Liga o itálico e digita: o texto já nasce em itálico, direto no campo.
    await userEvent.click(screen.getByRole("button", { name: "Itálico" }));
    await userEvent.keyboard("destaque");
    await waitFor(() =>
      expect(field().querySelector("em")?.textContent).toBe("destaque"),
    );
    expect(onValue).toHaveBeenLastCalledWith("_destaque_");
    expect(
      screen
        .getByRole("button", { name: "Itálico" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("does not turn typed markers into styles", async () => {
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);
    await waitFor(() =>
      expect(field().getAttribute("contenteditable")).toBe("true"),
    );
    await userEvent.click(field());
    await userEvent.keyboard("2 * 3 e **x**");
    expect(field().querySelector("strong")).toBeNull();
    expect(field().querySelector("em")).toBeNull();
  });
});
