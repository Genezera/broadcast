// @vitest-environment jsdom
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhoneField } from "./PhoneField";

afterEach(cleanup);

// Controlado como no formulário real, expondo o valor emitido.
function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <PhoneField label="Telefone" value={value} onChange={setValue} />
      <output data-testid="value">{value}</output>
    </>
  );
}

const input = () => screen.getByLabelText("Telefone") as HTMLInputElement;
const emitted = () => screen.getByTestId("value").textContent;

describe("PhoneField", () => {
  it("masks the number while typing and emits the international format", async () => {
    render(<Harness />);
    await userEvent.type(input(), "11999991111");
    expect(input().value).toBe("(11) 99999-1111");
    expect(emitted()).toBe("+55 11 99999 1111");
  });

  it("ignores letters while typing", async () => {
    render(<Harness />);
    await userEvent.type(input(), "11a99999b1111");
    expect(input().value).toBe("(11) 99999-1111");
  });

  it("never accepts more digits than the E.164 limit allows", async () => {
    render(<Harness />);
    await userEvent.type(input(), "1".repeat(30));
    // 15 dígitos no total, menos os 2 do DDI +55.
    expect(input().value.replace(/\D/g, "")).toHaveLength(13);
  });

  it("deletes the last digit when backspacing over a formatting character", async () => {
    render(<Harness />);
    await userEvent.type(input(), "1199");
    expect(input().value).toBe("(11) 99");
    await userEvent.type(input(), "{Backspace}{Backspace}{Backspace}");
    expect(input().value).toBe("1");
  });

  it("lets the user change the country, keeping the digits", async () => {
    render(<Harness initial="+55 11 99999 1111" />);
    expect(input().value).toBe("(11) 99999-1111");
    await userEvent.click(screen.getByRole("button", { name: /Alterar país/ }));
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /Portugal/ }),
    );
    expect(emitted()?.startsWith("+351")).toBe(true);
    expect(
      screen.getByRole("button", { name: /Portugal, \+351/ }),
    ).toBeTruthy();
  });

  it("switches country automatically when an international number is pasted", async () => {
    render(<Harness />);
    await userEvent.click(input());
    await userEvent.paste("+351912345678");
    expect(emitted()).toBe("+351 912 345 678");
    expect(input().value).toBe("912 345 678");
  });

  it("shows the stored number formatted when editing", () => {
    render(<Harness initial="+55 11 90000 0001" />);
    expect(input().value).toBe("(11) 90000-0001");
  });
});
