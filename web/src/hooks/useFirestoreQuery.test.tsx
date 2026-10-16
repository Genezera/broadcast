// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

type Handlers = {
  next: (snapshot: { docs: unknown[] }) => void;
  error: (cause: unknown) => void;
  unsubscribe: ReturnType<typeof vi.fn>;
};

// Cada chamada a onSnapshot registra os callbacks para o teste "emitir" depois.
const subscriptions: Handlers[] = [];
vi.mock("firebase/firestore", () => ({
  onSnapshot: (
    _query: unknown,
    next: Handlers["next"],
    error: Handlers["error"],
  ) => {
    const unsubscribe = vi.fn();
    subscriptions.push({ next, error, unsubscribe });
    return unsubscribe;
  },
}));

import { useFirestoreQuery } from "./useFirestoreQuery";

const doc = (id: string, data: object = {}) => ({ id, data: () => data });
const latest = () => subscriptions[subscriptions.length - 1];

const setup = (initial: { scope: string; max: number }) =>
  renderHook(
    ({ scope, max }) =>
      useFirestoreQuery<{ id: string }>(
        () => ({}) as never,
        [scope, max],
        scope,
      ),
    { initialProps: initial },
  );

beforeEach(() => {
  subscriptions.length = 0;
});
afterEach(cleanup);

describe("useFirestoreQuery", () => {
  it("starts loading and returns the documents with their ids", () => {
    const { result } = setup({ scope: "a", max: 20 });
    expect(result.current).toMatchObject({
      items: [],
      loading: true,
      error: "",
    });

    act(() => latest().next({ docs: [doc("1"), doc("2")] }));
    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual([{ id: "1" }, { id: "2" }]);
  });

  it("keeps the current items while loading more inside the same scope", () => {
    const { result, rerender } = setup({ scope: "a", max: 20 });
    act(() => latest().next({ docs: [doc("1")] }));

    rerender({ scope: "a", max: 40 });
    // A lista não pisca: os itens continuam, só marca que está recarregando.
    expect(result.current.items).toEqual([{ id: "1" }]);
    expect(result.current.loading).toBe(true);
    expect(subscriptions).toHaveLength(2);
    expect(subscriptions[0].unsubscribe).toHaveBeenCalled();
  });

  it("drops the previous scope's items as soon as the scope changes", () => {
    const { result, rerender } = setup({ scope: "conexao-a", max: 20 });
    act(() => latest().next({ docs: [doc("contato-da-a")] }));

    rerender({ scope: "conexao-b", max: 20 });
    // Nem por um instante aparecem os itens da conexão anterior.
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(true);

    act(() => latest().next({ docs: [doc("contato-da-b")] }));
    expect(result.current.items).toEqual([{ id: "contato-da-b" }]);
    expect(result.current.loading).toBe(false);
  });

  it("does not carry an error over to another scope", () => {
    const { result, rerender } = setup({ scope: "a", max: 20 });
    act(() => latest().error({ code: "permission-denied" }));
    expect(result.current.error).not.toBe("");
    expect(result.current.items).toEqual([]);

    rerender({ scope: "b", max: 20 });
    expect(result.current.error).toBe("");
    expect(result.current.loading).toBe(true);
  });

  it("closes the subscription when unmounted", () => {
    const { unmount } = setup({ scope: "a", max: 20 });
    unmount();
    expect(latest().unsubscribe).toHaveBeenCalled();
  });
});
