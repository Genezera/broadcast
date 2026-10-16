// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { FormattedText } from "./FormattedText";

afterEach(cleanup);

describe("FormattedText", () => {
  it("renders each style with its own element", () => {
    const { container } = render(
      <FormattedText text="*negrito* _itálico_ ++sublinhado++ ~riscado~" />,
    );
    expect(container.querySelector("strong")?.textContent).toBe("negrito");
    expect(container.querySelector("em")?.textContent).toBe("itálico");
    expect(container.querySelector("u")?.textContent).toBe("sublinhado");
    expect(container.querySelector("s")?.textContent).toBe("riscado");
  });

  it("never turns user text into HTML", () => {
    const { container } = render(
      <FormattedText text={'<img src=x onerror="alert(1)"> *ok*'} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img src=x");
    expect(container.querySelector("strong")?.textContent).toBe("ok");
  });
});
