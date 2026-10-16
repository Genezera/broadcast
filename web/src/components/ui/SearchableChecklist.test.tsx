// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchableChecklist } from "./SearchableChecklist";

afterEach(cleanup);

const items = [
  { id: "1", label: "Ana Souza", hint: "+55 11 90000-0001" },
  { id: "2", label: "João Lima", hint: "+55 21 98888-0002" },
  { id: "3", label: "Joana Dias", hint: "+55 31 97777-0003" },
];

const setup = (value: string[] = []) => {
  const onChange = vi.fn();
  render(
    <SearchableChecklist
      items={items}
      value={value}
      onChange={onChange}
      title="Destinatários"
      selectedLabel="(0)"
      searchLabel="Buscar"
      emptyText="Vazio"
    />,
  );
  return onChange;
};

describe("SearchableChecklist", () => {
  it("filters by name ignoring accents and case", async () => {
    setup();
    await userEvent.type(screen.getByLabelText("Buscar"), "JOAO");
    expect(screen.getByText("João Lima")).toBeTruthy();
    expect(screen.queryByText("Ana Souza")).toBeNull();
  });

  it("filters by phone digits", async () => {
    setup();
    await userEvent.type(screen.getByLabelText("Buscar"), "97777");
    expect(screen.getByText("Joana Dias")).toBeTruthy();
    expect(screen.queryByText("João Lima")).toBeNull();
  });

  it("selects only what the search is showing", async () => {
    const onChange = setup(["1"]);
    await userEvent.type(screen.getByLabelText("Buscar"), "jo");
    await userEvent.click(screen.getByText("Selecionar todos"));
    expect(onChange).toHaveBeenCalledWith(["1", "2", "3"]);
  });

  it("clears only the filtered items", async () => {
    const onChange = setup(["1", "2", "3"]);
    await userEvent.type(screen.getByLabelText("Buscar"), "jo");
    await userEvent.click(screen.getByText("Limpar seleção"));
    expect(onChange).toHaveBeenCalledWith(["1"]);
  });

  it("says when nothing matches", async () => {
    setup();
    await userEvent.type(screen.getByLabelText("Buscar"), "zzz");
    expect(screen.getByText("Nada encontrado.")).toBeTruthy();
  });

  it("keeps a long list inside its own scroll area", () => {
    setup();
    const list = screen.getByText("Ana Souza").closest("div.overflow-y-auto");
    expect(list).toBeTruthy();
    expect(list?.className).toMatch(/max-h-/);
  });
});
