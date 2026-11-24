import { expect, it } from "vitest";
import { indexLockedPeriods, isQuantityLocked } from "./lockedPeriods";

it("locks only the matching series, month and quantity", () => {
  const locks = indexLockedPeriods([
    { FK_SERIES: 1, TX_PERIOD: "2026-01", TX_OPINION: "QY_SALES" },
  ]);
  const row = {
    FK_SERIES: 1,
    TX_PERIOD: "2026-01",
    QY_SALES: 5,
    QY_DEMAND: 10,
  };
  expect(isQuantityLocked(locks, row, "QY_SALES")).toBe(true);
  expect(isQuantityLocked(locks, row, "QY_DEMAND")).toBe(false);
  expect(isQuantityLocked(locks, { ...row, FK_SERIES: 2 }, "QY_SALES")).toBe(
    false,
  );
  expect(
    isQuantityLocked(locks, { ...row, TX_PERIOD: "2026-02" }, "QY_SALES"),
  ).toBe(false);
});
