import { useCallback, useEffect, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  themeQuartz,
  type CellEditRequestEvent,
  type ColDef,
  type GridApi,
} from "ag-grid-community";
import { observationColumns } from "./observationColumns";
import {
  isObservationQuantity,
  observationKey,
} from "../../model/observationEdits";
import type { LockedPeriodIndex } from "../../model/lockedPeriods";
import type { Observation, ObservationQuantity } from "../../model/types";
import styles from "./ObservationsGrid.module.css";

interface ObservationsGridProps {
  seriesId: number;
  rows: Observation[];
  originalRows: readonly Observation[];
  locks: LockedPeriodIndex;
  onEdit: (
    row: Observation,
    field: ObservationQuantity,
    value: unknown,
  ) => void;
  onReady: (api: GridApi<Observation>) => void;
}

const defaultColDef: ColDef<Observation> = {
  flex: 1,
  minWidth: 130,
  sortable: true,
  resizable: true,
};
const pageSizes = [25, 50, 100];

export function ObservationsGrid({
  seriesId,
  rows,
  originalRows,
  locks,
  onEdit,
  onReady,
}: ObservationsGridProps) {
  const gridApi = useRef<GridApi<Observation>>();
  useEffect(() => {
    gridApi.current?.paginationGoToFirstPage();
  }, [seriesId]);
  const originals = useMemo(
    () => new Map(originalRows.map((row) => [observationKey(row), row])),
    [originalRows],
  );
  const columnDefs = useMemo(
    () => observationColumns(locks, originals),
    [locks, originals],
  );
  const handleEdit = useCallback(
    (event: CellEditRequestEvent<Observation>) => {
      const field = event.colDef.field;
      if (event.data && isObservationQuantity(field))
        onEdit(event.data, field, event.newValue);
    },
    [onEdit],
  );

  return (
    <div className={styles.grid}>
      <AgGridReact<Observation>
        theme={themeQuartz}
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={({ data }) => observationKey(data)}
        pagination
        paginationPageSize={25}
        paginationPageSizeSelector={pageSizes}
        readOnlyEdit
        stopEditingWhenCellsLoseFocus
        onCellEditRequest={handleEdit}
        onGridReady={({ api }) => {
          gridApi.current = api;
          onReady(api);
        }}
        onPaginationChanged={({ api, newPage }) => {
          if (newPage) api.stopEditing();
        }}
        overlayNoRowsTemplate="No observations for this series."
      />
    </div>
  );
}
