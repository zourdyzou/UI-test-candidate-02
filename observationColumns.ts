import type { ColDef } from "ag-grid-community";
import {
  isQuantityLocked,
  type LockedPeriodIndex,
} from "../../model/lockedPeriods";
import type { Observation, ObservationQuantity } from "../../model/types";
import styles from "./ObservationsGrid.module.css";
import {
  isObservationModified,
  observationKey,
} from "../../model/observationEdits";

export function observationColumns(
  locks: LockedPeriodIndex,
  originals: ReadonlyMap<string, Observation>,
): ColDef<Observation>[] {
  const modified = (row: Observation, field: ObservationQuantity) =>
    isObservationModified(row, originals.get(observationKey(row)), field);
  const quantityColumn = (
    field: ObservationQuantity,
    headerName: string,
  ): ColDef<Observation> => ({
    field,
    headerName,
    cellDataType: "number",
    cellEditor: "agNumberCellEditor",
    editable: ({ data }) => !!data && !isQuantityLocked(locks, data, field),
    valueFormatter: ({ value }) => (value == null ? "—" : String(value)),
    cellClassRules: {
      [styles.locked]: ({ data }) =>
        !!data && isQuantityLocked(locks, data, field),
      [styles.modified]: ({ data }) =>
        !!data &&
        !isQuantityLocked(locks, data, field) &&
        modified(data, field),
      [styles.editable]: ({ data }) =>
        !!data &&
        !isQuantityLocked(locks, data, field) &&
        !modified(data, field),
    },
    tooltipValueGetter: ({ data }) =>
      data && isQuantityLocked(locks, data, field)
        ? "Locked for this series and month"
        : data && modified(data, field)
          ? "Modified locally — not saved. Double-click or press Enter to edit"
          : "Editable — double-click or press Enter to edit",
  });
  return [
    {
      field: "TX_PERIOD",
      headerName: "Period",
      editable: false,
      minWidth: 120,
    },
    quantityColumn("QY_SALES", "Sales"),
    quantityColumn("QY_DEMAND", "Demand"),
    quantityColumn("QY_SUPPLY", "Supply"),
  ];
}
