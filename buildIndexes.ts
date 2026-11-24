import type { Observation, SeriesId } from "./types";

export function indexObservations(rows: readonly Observation[]) {
  const index = new Map<SeriesId, Observation[]>();
  for (const row of rows) {
    const group = index.get(row.FK_SERIES);
    if (group) group.push(row);
    else index.set(row.FK_SERIES, [row]);
  }
  for (const group of index.values())
    group.sort((a, b) => a.TX_PERIOD.localeCompare(b.TX_PERIOD));
  return index;
}
