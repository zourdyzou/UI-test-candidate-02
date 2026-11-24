import { useCallback, useState } from "react";
import {
  observationKey,
  updateObservationEdit,
  type ObservationEdits,
} from "../model/observationEdits";
import type { LockedPeriodIndex } from "../model/lockedPeriods";
import type { Observation, ObservationQuantity } from "../model/types";

export function useObservationEdits(
  locks: LockedPeriodIndex,
  originals: ReadonlyMap<string, Observation>,
) {
  const [edits, setEdits] = useState<ObservationEdits>(() => new Map());
  const editObservation = useCallback(
    (row: Observation, field: ObservationQuantity, value: unknown) => {
      const original = originals.get(observationKey(row));
      if (!original) return;
      setEdits((previous) =>
        updateObservationEdit(previous, original, field, value, locks),
      );
    },
    [locks, originals],
  );
  return { edits, editObservation };
}
