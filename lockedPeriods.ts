import type { LockedPeriod, Observation, ObservationQuantity } from "./types";

export type LockedPeriodIndex = ReadonlySet<string>;
const lockKey = (
  series: number,
  period: string,
  quantity: ObservationQuantity,
) => `${series}:${period}:${quantity}`;

export function indexLockedPeriods(
  locks: readonly LockedPeriod[],
): LockedPeriodIndex {
  return new Set(
    locks.map((lock) =>
      lockKey(lock.FK_SERIES, lock.TX_PERIOD, lock.TX_OPINION),
    ),
  );
}

export function isQuantityLocked(
  locks: LockedPeriodIndex,
  row: Observation,
  quantity: ObservationQuantity,
) {
  return locks.has(lockKey(row.FK_SERIES, row.TX_PERIOD, quantity));
}
