import { describe, expect, it } from "bun:test";

import {
  assessProduct,
  assessProducts,
  buildAnalysisPrompt,
  suggestedReplenishment,
  type ProductSnapshot,
  type SupplierTerm,
} from "./ai.analysis";

function term(overrides: Partial<SupplierTerm> = {}): SupplierTerm {
  return {
    supplierID: 1,
    supplierName: "Acme",
    purchasePrice: 10,
    leadTimeDays: 3,
    minOrderQty: 1,
    isPreferred: false,
    ...overrides,
  };
}

function snapshot(overrides: Partial<ProductSnapshot> = {}): ProductSnapshot {
  return {
    productID: 1,
    productName: "Widget",
    stock: 50,
    alertQty: 10,
    purchasePrice: 10,
    salePrice: 20,
    totalSold: 100,
    revenue: 2000,
    suppliers: [],
    ...overrides,
  };
}

describe("suggestedReplenishment", () => {
  it("returns 0 when stock is at or above the target", () => {
    expect(suggestedReplenishment(50, 10, term())).toBe(0);
  });

  it("orders up to twice the alert quantity without an MOQ", () => {
    // target = max(20, 5) = 20; needed = 20 - 5 = 15
    expect(suggestedReplenishment(5, 10, undefined)).toBe(15);
  });

  it("rounds up to the supplier minimum order quantity", () => {
    // needed = 15, MOQ = 12 -> ceil(15 / 12) * 12 = 24
    expect(suggestedReplenishment(5, 10, term({ minOrderQty: 12 }))).toBe(24);
  });

  it("treats a non-positive MOQ as no MOQ", () => {
    expect(suggestedReplenishment(5, 10, term({ minOrderQty: 0 }))).toBe(15);
  });
});

describe("assessProduct", () => {
  it("flags out-of-stock products", () => {
    const result = assessProduct(snapshot({ stock: 0, totalSold: 30 }));
    expect(result.stockStatus).toBe("out_of_stock");
    expect(result.demandLevel).toBe("high");
    expect(result.suggestedOrderQty).toBeGreaterThan(0);
  });

  it("flags low stock at or below the alert quantity", () => {
    const result = assessProduct(snapshot({ stock: 10, alertQty: 10 }));
    expect(result.stockStatus).toBe("low");
  });

  it("reports healthy stock above the alert quantity", () => {
    const result = assessProduct(snapshot({ stock: 100, alertQty: 10 }));
    expect(result.stockStatus).toBe("healthy");
  });

  it("reports no demand when nothing has sold", () => {
    const result = assessProduct(snapshot({ totalSold: 0 }));
    expect(result.demandLevel).toBe("none");
  });

  it("prefers the preferred supplier over the cheapest one", () => {
    const result = assessProduct(
      snapshot({
        stock: 1,
        alertQty: 5,
        suppliers: [
          term({ supplierID: 7, purchasePrice: 8, minOrderQty: 5 }),
          term({ supplierID: 9, purchasePrice: 12, isPreferred: true, minOrderQty: 4 }),
        ],
      }),
    );

    expect(result.suggestedSupplierID).toBe(9);
    expect(result.minOrderQty).toBe(4);
  });

  it("falls back to the cheapest supplier when none is preferred", () => {
    const result = assessProduct(
      snapshot({
        stock: 1,
        alertQty: 5,
        suppliers: [
          term({ supplierID: 7, purchasePrice: 12 }),
          term({ supplierID: 9, purchasePrice: 8 }),
        ],
      }),
    );

    expect(result.suggestedSupplierID).toBe(9);
  });
});

describe("assessProducts", () => {
  it("sorts the most urgent stock situations first", () => {
    const result = assessProducts([
      snapshot({ productID: 1, stock: 100, alertQty: 10 }),
      snapshot({ productID: 2, stock: 5, alertQty: 10 }),
      snapshot({ productID: 3, stock: 0, alertQty: 10 }),
    ]);

    expect(result.map((p) => p.productID)).toEqual([3, 2, 1]);
  });
});

describe("buildAnalysisPrompt", () => {
  it("includes the serialized metrics and a default task", () => {
    const prompt = buildAnalysisPrompt(
      {
        generatedAt: "2026-01-01T00:00:00.000Z",
        totals: { products: 0, outOfStock: 0, lowStock: 0 },
        products: [],
      },
      undefined,
    );

    expect(prompt).toContain("Business data (JSON)");
    expect(prompt).toContain("2026-01-01T00:00:00.000Z");
  });

  it("uses the caller question when provided", () => {
    const prompt = buildAnalysisPrompt(
      {
        generatedAt: "2026-01-01T00:00:00.000Z",
        totals: { products: 0, outOfStock: 0, lowStock: 0 },
        products: [],
      },
      "What should I reorder first?",
    );

    expect(prompt).toContain("What should I reorder first?");
  });
});
