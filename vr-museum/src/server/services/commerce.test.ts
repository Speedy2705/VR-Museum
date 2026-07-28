import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

let calculateCartSubtotal: typeof import("./cart.service").calculateCartSubtotal;
let calculateCheckout: typeof import("./checkout.service").calculateCheckout;

beforeAll(async () => {
  ({ calculateCartSubtotal } = await import("./cart.service"));
  ({ calculateCheckout } = await import("./checkout.service"));
});

describe("cart totals", () => {
  it("sums quantities using currency-safe cent rounding", () => {
    expect(
      calculateCartSubtotal([
        { price: "19.99", quantity: 2 },
        { price: 5, quantity: 3 },
      ]),
    ).toBe(54.98);
  });

  it("returns zero for an empty cart", () => {
    expect(calculateCartSubtotal([])).toBe(0);
  });
});

describe("checkout calculation", () => {
  it("adds a rounded five-percent service fee", () => {
    expect(calculateCheckout([{ price: "19.99", quantity: 1 }])).toEqual({
      subtotal: 19.99,
      serviceFee: 1,
      total: 20.99,
    });
  });

  it("calculates multi-quantity orders from server prices", () => {
    expect(
      calculateCheckout([
        { price: 10, quantity: 2 },
        { price: "4.50", quantity: 1 },
      ]),
    ).toEqual({ subtotal: 24.5, serviceFee: 1.23, total: 25.73 });
  });
});
