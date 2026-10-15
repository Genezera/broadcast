import { test } from "node:test";
import assert from "node:assert/strict";

process.env.GCLOUD_PROJECT = "demo-broadcast-unit";
const { resolveScheduleMs, parseInput, createMessageInput } =
  await import("../functions/lib/shared/validators.js");

const NOW = Date.parse("2026-10-15T12:00:00Z");
const base = { connectionId: "c1", contactIds: ["a"], body: "Oi", mode: "now" };

test("resolveScheduleMs returns null for immediate sending", () => {
  assert.equal(resolveScheduleMs({ mode: "now" }, NOW), null);
});

test("resolveScheduleMs keeps the absolute instant regardless of the offset", () => {
  const local = resolveScheduleMs(
    { mode: "scheduled", scheduledAt: "2026-10-15T18:00:00-03:00" },
    NOW,
  );
  assert.equal(local, Date.parse("2026-10-15T21:00:00Z"));
});

test("resolveScheduleMs rejects past, missing and too distant dates", () => {
  for (const scheduledAt of [
    "2026-10-15T11:59:59Z",
    "2026-10-15T12:00:00Z",
    "2028-01-01T00:00:00Z",
    null,
    undefined,
  ]) {
    assert.throws(
      () => resolveScheduleMs({ mode: "scheduled", scheduledAt }, NOW),
      { code: "invalid-argument" },
    );
  }
});

test("parseInput trims the body and reports user-facing messages", () => {
  assert.equal(
    parseInput(createMessageInput, { ...base, body: "  Oi  " }).body,
    "Oi",
  );
  assert.throws(() => parseInput(createMessageInput, { ...base, body: " " }), {
    code: "invalid-argument",
    message: "A mensagem não pode ficar vazia.",
  });
  assert.throws(() => parseInput(createMessageInput, null), {
    code: "invalid-argument",
  });
});

test("validation errors carry a stable key for the client to translate", () => {
  assert.throws(
    () => parseInput(createMessageInput, { ...base, body: " " }),
    (error) => error.details?.key === "bodyEmpty",
  );
  assert.throws(
    () => parseInput(createMessageInput, { ...base, body: "x".repeat(2001) }),
    (error) =>
      error.details?.key === "bodyTooLong" &&
      typeof error.details.params?.max === "number",
  );
});
