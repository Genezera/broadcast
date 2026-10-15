import { describe, expect, it } from "vitest";
import {
  FAQ,
  getNode,
  HELP_NODES,
  ROOT_ID,
  topicForSection,
} from "./helpContent";

describe("help content graph", () => {
  const nodes = Object.values(HELP_NODES);

  it("has a root topic", () => {
    expect(getNode(ROOT_ID)).toBeDefined();
  });

  it("never points a button to a topic that does not exist", () => {
    for (const node of nodes) {
      for (const id of node.next) {
        expect(getNode(id), `${node.id} -> ${id}`).toBeDefined();
      }
    }
  });

  it("reaches every topic starting from the root", () => {
    const seen = new Set<string>([ROOT_ID]);
    const queue = [ROOT_ID];
    while (queue.length) {
      for (const id of getNode(queue.shift()!)!.next) {
        if (!seen.has(id)) {
          seen.add(id);
          queue.push(id);
        }
      }
    }
    expect([...seen].sort()).toEqual(nodes.map((node) => node.id).sort());
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
      expect(getNode(topicForSection(section)!)).toBeDefined();
    }
  });

  it("has FAQ entries with question and answer", () => {
    expect(FAQ.length).toBeGreaterThan(5);
    for (const item of FAQ) {
      expect(item.question.endsWith("?")).toBe(true);
      expect(item.answer.length).toBeGreaterThan(20);
    }
  });
});
