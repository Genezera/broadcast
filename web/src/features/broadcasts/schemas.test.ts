import { describe, expect, it } from "vitest";
import { translators } from "../../i18n/translate";
import { toLocalInputValue } from "../../lib/dates";
import { MAX_CONNECTIONS, MAX_RECIPIENTS, messageSchema } from "./schemas";

const schema = messageSchema(translators.pt);

const valid = {
  audience: "contacts" as const,
  connectionId: "c1",
  contactIds: ["a"],
  connectionIds: [] as string[],
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

  it("requires a connection when choosing contacts", () => {
    expect(messages({ ...valid, connectionId: "" })).toContain(
      "Escolha uma conexão.",
    );
  });

  it("limits the number of recipients", () => {
    const many = Array.from({ length: MAX_RECIPIENTS + 1 }, (_, i) => `c${i}`);
    expect(messages({ ...valid, contactIds: many })).toContain(
      `Selecione no máximo ${MAX_RECIPIENTS} contatos.`,
    );
  });

  describe("sending to connections", () => {
    const whole = {
      ...valid,
      audience: "connections" as const,
      contactIds: [],
      connectionIds: ["c1", "c2"],
    };

    it("accepts connections without picking contacts", () => {
      expect(messages(whole)).toEqual([]);
    });

    it("requires at least one connection and ignores the contact fields", () => {
      expect(messages({ ...whole, connectionIds: [] })).toContain(
        "Selecione pelo menos uma conexão.",
      );
      // Sem contatos marcados e sem conexão única: não exige contatos aqui.
      expect(messages({ ...whole, connectionId: "" })).toEqual([]);
    });

    it("limits how many connections are chosen at once", () => {
      const many = Array.from(
        { length: MAX_CONNECTIONS + 1 },
        (_, i) => `c${i}`,
      );
      expect(messages({ ...whole, connectionIds: many })).toContain(
        `Selecione no máximo ${MAX_CONNECTIONS} conexões.`,
      );
    });
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

  it("keeps the schedule a message already had, even if it just passed", () => {
    const justPassed = toLocalInputValue(new Date(Date.now() - 30_000));
    const edited = messageSchema(translators.pt, justPassed);
    const values = {
      ...valid,
      mode: "scheduled" as const,
      scheduledAt: justPassed,
    };
    expect(edited.safeParse(values).success).toBe(true);
    // Sem a data original, a mesma data seria recusada.
    expect(schema.safeParse(values).success).toBe(false);
    // Mudar para outra data passada continua inválido.
    const other = toLocalInputValue(new Date(Date.now() - 7_200_000));
    expect(edited.safeParse({ ...values, scheduledAt: other }).success).toBe(
      false,
    );
  });
});
