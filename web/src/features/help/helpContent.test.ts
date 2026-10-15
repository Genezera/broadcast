import { describe, expect, it } from "vitest";
import { LANGS } from "../../i18n/translate";
import {
  FAQ,
  getNode,
  ROOT_ID,
  TOPIC_IDS,
  topicForSection,
} from "./helpContent";

describe.each(LANGS)("help content (%s)", (lang) => {
  const nodes = TOPIC_IDS.map((id) => getNode(lang, id)!);

  it("has a root topic", () => {
    expect(getNode(lang, ROOT_ID)).toBeDefined();
  });

  it("has text for every topic", () => {
    for (const id of TOPIC_IDS) {
      expect(getNode(lang, id)?.label, id).toBeTruthy();
    }
  });

  it("never points a button to a topic that does not exist", () => {
    for (const node of nodes) {
      for (const id of node.next) {
        expect(getNode(lang, id), `${node.id} -> ${id}`).toBeDefined();
      }
    }
  });

  it("reaches every topic starting from the root", () => {
    const seen = new Set<string>([ROOT_ID]);
    const queue = [ROOT_ID];
    while (queue.length) {
      for (const id of getNode(lang, queue.shift()!)!.next) {
        if (!seen.has(id)) {
          seen.add(id);
          queue.push(id);
        }
      }
    }
    expect([...seen].sort()).toEqual([...TOPIC_IDS].sort());
  });

  it("gives every topic either an answer or follow-up buttons", () => {
    for (const node of nodes) {
      const hasAnswer = !!node.intro || !!node.steps?.length;
      expect(hasAnswer, node.id).toBe(true);
      expect(node.next.length, node.id).toBeGreaterThan(0);
    }
  });

  it("uses only internal routes in actions", () => {
    for (const node of nodes) {
      if (node.action) expect(node.action.to.startsWith("/")).toBe(true);
    }
  });

  it("suggests an existing topic for each screen", () => {
    for (const section of [
      "overview",
      "connections",
      "contacts",
      "broadcasts",
      "profile",
    ] as const) {
      expect(getNode(lang, topicForSection(section)!)).toBeDefined();
    }
  });

  it("has FAQ entries with question and answer", () => {
    expect(FAQ[lang].length).toBeGreaterThan(5);
    for (const item of FAQ[lang]) {
      expect(item.question.endsWith("?")).toBe(true);
      expect(item.answer.length).toBeGreaterThan(20);
    }
  });
});

describe("help content parity", () => {
  it("has the same number of FAQ entries in every language", () => {
    expect(FAQ.en).toHaveLength(FAQ.pt.length);
  });

  it("keeps the same structure (steps, tips, actions) in every language", () => {
    for (const id of TOPIC_IDS) {
      const pt = getNode("pt", id)!;
      const en = getNode("en", id)!;
      expect(en.steps?.length, id).toBe(pt.steps?.length);
      expect(en.tips?.length, id).toBe(pt.tips?.length);
      expect(en.action?.to, id).toBe(pt.action?.to);
      expect(!!en.intro, id).toBe(!!pt.intro);
    }
  });
});
