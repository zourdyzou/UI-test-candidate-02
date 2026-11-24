import { isQuantityLocked, type LockedPeriodIndex } from "./lockedPeriods";
import type { Observation, ObservationQuantity } from "./types";

export type ObservationEdits = ReadonlyMap<
  string,
  Partial<Record<ObservationQuantity, number | null>>
>;
export const observationKey = (row: Observation) =>
  `${row.FK_SERIES}:${row.TX_PERIOD}`;

/** Missing and null quantities both represent an empty cell. */
export function isObservationModified(
  row: Observation,
  original: Observation | undefined,
  field: ObservationQuantity,
) {
  return (
    original !== undefined && (row[field] ?? null) !== (original[field] ?? null)
  );
}

export function isObservationQuantity(
  field: unknown,
): field is ObservationQuantity {
  return field === "QY_SALES" || field === "QY_DEMAND" || field === "QY_SUPPLY";
}

export function updateObservationEdit(
  edits: ObservationEdits,
  row: Observation,
  field: ObservationQuantity,
  value: unknown,
  locks: LockedPeriodIndex,
): ObservationEdits {
  if (isQuantityLocked(locks, row, field)) return edits;
  if (value !== null && (typeof value !== "number" || !Number.isFinite(value)))
    return edits;
  const key = observationKey(row);
  const patch = edits.get(key);
  if ((patch && field in patch ? patch[field] : (row[field] ?? null)) === value)
    return edits;
  const next = new Map(edits);
  const nextPatch = { ...patch };
  if (value === (row[field] ?? null)) delete nextPatch[field];
  else nextPatch[field] = value;
  if (Object.keys(nextPatch).length) next.set(key, nextPatch);
  else next.delete(key);
  return next;
}

export function applyObservationEdits(
  rows: readonly Observation[],
  edits: ObservationEdits,
): Observation[] {
  return rows.map((row) => {
    const patch = edits.get(observationKey(row));
    return patch ? { ...row, ...patch } : row;
  });
}
