import { expect, it } from "vitest";
import {
  applyObservationEdits,
  updateObservationEdit,
  type ObservationEdits,
} from "./observationEdits";
import { indexLockedPeriods } from "./lockedPeriods";

const row = {
  FK_SERIES: 1,
  TX_PERIOD: "2026-01",
  QY_SALES: 5,
  QY_DEMAND: 10,
  QY_SUPPLY: 7,
};
const locks = indexLockedPeriods([
  { FK_SERIES: 1, TX_PERIOD: "2026-01", TX_OPINION: "QY_SALES" },
]);

it("merges edits by series, period and quantity without mutating source data", () => {
  const original = Object.freeze({ ...row });
  const empty: ObservationEdits = new Map();
  let edits = updateObservationEdit(empty, original, "QY_DEMAND", 0, locks);
  edits = updateObservationEdit(edits, original, "QY_SUPPLY", null, locks);
  edits = updateObservationEdit(
    edits,
    { ...row, FK_SERIES: 2 },
    "QY_DEMAND",
    99,
    locks,
  );
  const results = applyObservationEdits(
    [original, { ...row, FK_SERIES: 2 }],
    edits,
  );
  expect(results[0]).toEqual({ ...row, QY_DEMAND: 0, QY_SUPPLY: null });
  expect(results[1].QY_DEMAND).toBe(99);
  expect(original).toEqual(row);
  expect(empty.size).toBe(0);
});

it("rejects locked cells and invalid numbers even outside the grid", () => {
  const edits: ObservationEdits = new Map();
  expect(updateObservationEdit(edits, row, "QY_SALES", 50, locks)).toBe(edits);
  for (const value of [NaN, Infinity, "abc", undefined, ""]) {
    expect(updateObservationEdit(edits, row, "QY_DEMAND", value, locks)).toBe(
      edits,
    );
  }
});

it("supports clearing and restoring a numeric value", () => {
  let edits = updateObservationEdit(new Map(), row, "QY_DEMAND", null, locks);
  expect(applyObservationEdits([row], edits)[0].QY_DEMAND).toBeNull();
  edits = updateObservationEdit(edits, row, "QY_DEMAND", 10, locks);
  expect(applyObservationEdits([row], edits)[0].QY_DEMAND).toBe(10);
  expect(edits.size).toBe(0);
  // A reverted field must not mask new data received from the server.
  expect(
    applyObservationEdits([{ ...row, QY_DEMAND: 30 }], edits)[0].QY_DEMAND,
  ).toBe(30);
});
