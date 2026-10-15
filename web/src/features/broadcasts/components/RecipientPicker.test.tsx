// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecipientPicker } from "./RecipientPicker";

afterEach(cleanup);

const choices = [
  { id: "a", name: "Ana", phone: "+55 11 90000-0001" },
  { id: "b", name: "Bruno", phone: "+55 11 90000-0002" },
];

const setup = (value: string[], removed: string[] = [], error?: string) => {
  const onChange = vi.fn();
  render(
    <RecipientPicker
      choices={choices}
      removedIds={new Set(removed)}
      value={value}
      error={error}
      onChange={onChange}
    />,
  );
  return onChange;
};

describe("RecipientPicker", () => {
  it("toggles a single recipient", async () => {
    const onChange = setup(["a"]);
    await userEvent.click(screen.getByRole("checkbox", { name: /Bruno/ }));
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
    await userEvent.click(screen.getByRole("checkbox", { name: /Ana/ }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("selects everyone, then clears the selection", async () => {
    const onChange = setup([]);
    await userEvent.click(screen.getByText("Selecionar todos"));
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
    cleanup();

    const onClear = setup(["a", "b"]);
    await userEvent.click(screen.getByText("Limpar seleção"));
    expect(onClear).toHaveBeenCalledWith([]);
  });

  it("flags removed contacts and shows validation errors", () => {
    setup(["a"], ["b"], "Selecione pelo menos um contato.");
    expect(screen.getByText(/Bruno \(removido\)/)).toBeTruthy();
    expect(screen.getByText("Selecione pelo menos um contato.")).toBeTruthy();
  });
});
