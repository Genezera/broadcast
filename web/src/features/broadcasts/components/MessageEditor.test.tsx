// @vitest-environment jsdom
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageEditor } from "./MessageEditor";

afterEach(cleanup);

function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <MessageEditor value={value} onChange={setValue} maxLength={200} />;
}

const field = () => screen.getByLabelText("Mensagem") as HTMLTextAreaElement;

describe("MessageEditor", () => {
  it("wraps the selected text when a style button is clicked", async () => {
    render(<Harness initial="olá mundo" />);
    field().setSelectionRange(4, 9);
    await userEvent.click(screen.getByRole("button", { name: "Negrito" }));
    expect(field().value).toBe("olá *mundo*");
  });

  it("applies underline with the keyboard shortcut", async () => {
    render(<Harness initial="texto" />);
    field().setSelectionRange(0, 5);
    field().focus();
    await userEvent.keyboard("{Control>}u{/Control}");
    expect(field().value).toBe("__texto__");
  });

  it("shows a preview only when the text has formatting", async () => {
    render(<Harness initial="sem estilo" />);
    expect(screen.queryByText("Prévia")).toBeNull();
    await userEvent.type(field(), " *forte*");
    expect(screen.getByText("Prévia")).toBeTruthy();
    expect(screen.getByText("forte").tagName).toBe("STRONG");
  });
});
