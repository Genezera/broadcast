import { describe, expect, it } from "vitest";
import { translators } from "../../i18n/translate";
import { toLocalInputValue } from "../../lib/dates";
import { messageSchema } from "./schemas";

const schema = messageSchema(translators.pt);

const valid = {
  contactIds: ["a"],
  body: "Olá",
  mode: "now" as const,
  scheduledAt: "",
};

const messages = (values: unknown) => {
  const result = schema.safeParse(values);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
};

describe("messageSchema", () => {
  it("accepts an immediate message", () => {
    expect(messages(valid)).toEqual([]);
  });

  it("requires recipients and a non-empty body", () => {
    expect(messages({ ...valid, contactIds: [] })).toContain(
      "Selecione pelo menos um contato.",
    );
    expect(messages({ ...valid, body: "   " })).toContain(
      "Escreva a mensagem.",
    );
  });

  it("requires a future date when scheduling", () => {
    const past = toLocalInputValue(new Date(Date.now() - 3_600_000));
    const future = toLocalInputValue(new Date(Date.now() + 3_600_000));
    expect(messages({ ...valid, mode: "scheduled" })).toContain(
      "Informe a data e o horário do envio.",
    );
    expect(
      messages({ ...valid, mode: "scheduled", scheduledAt: past }),
    ).toContain("Escolha uma data e um horário futuros.");
    expect(
      messages({ ...valid, mode: "scheduled", scheduledAt: future }),
    ).toEqual([]);
  });
});
