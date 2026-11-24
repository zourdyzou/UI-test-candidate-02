import { Box, Divider, Paper, Typography } from "@mui/material";
import { useSeriesExplorerData } from "./hooks/useSeriesExplorerData";
import { useMemo, useRef, useState } from "react";
import { buildTree } from "./model/buildTree";
import { SeriesTree } from "./components/SeriesTree/SeriesTree";
import type { Observation, SeriesId } from "./model/types";
import type { GridApi } from "ag-grid-community";
import { indexObservations } from "./model/buildIndexes";
import { indexLockedPeriods } from "./model/lockedPeriods";
import {
  applyObservationEdits,
  observationKey,
} from "./model/observationEdits";
import { useObservationEdits } from "./hooks/useObservationEdits";
import { ObservationsGrid } from "./components/ObservationsGrid/ObservationsGrid";
import { ObservationsLegend } from "./components/ObservationsGrid/ObservationsLegend";

import { QueryContent } from "../../app/QueryContent";

export default function SeriesExplorer() {
  const query = useSeriesExplorerData();
  const { data } = query;
  const [selectedId, setSelectedId] = useState<SeriesId>();
  const gridApi = useRef<GridApi<Observation>>();
  const observations = useMemo(
    () => indexObservations(data?.observations ?? []),
    [data?.observations],
  );
  const locks = useMemo(
    () => indexLockedPeriods(data?.lockedPeriods ?? []),
    [data?.lockedPeriods],
  );
  const originals = useMemo(
    () =>
      new Map(
        (data?.observations ?? []).map((row) => [observationKey(row), row]),
      ),
    [data?.observations],
  );
  const { edits, editObservation } = useObservationEdits(locks, originals);
  const originalRows = useMemo(
    () =>
      selectedId === undefined ? [] : (observations.get(selectedId) ?? []),
    [selectedId, observations],
  );
  const rows = useMemo(
    () => applyObservationEdits(originalRows, edits),
    [originalRows, edits],
  );
  const seriesById = useMemo(
    () => new Map((data?.series ?? []).map((series) => [series.KY_ID, series])),
    [data?.series],
  );
  const selectedSeries =
    selectedId === undefined ? undefined : seriesById.get(selectedId);

  function selectSeries(id: SeriesId) {
    // Commit an active editor before showing another series.
    if (gridApi.current && !gridApi.current.isDestroyed())
      gridApi.current.stopEditing();
    setSelectedId(id);
  }
  const tree = useMemo(() => {
    try {
      return {
        nodes: buildTree(data?.series ?? [], data?.hierarchy ?? []),
        error: null,
      };
    } catch (error) {
      return {
        nodes: [],
        error:
          error instanceof Error ? error.message : "Invalid series hierarchy.",
      };
    }
  }, [data?.series, data?.hierarchy]);

  return (
    <Box
      sx={{
        display: "grid",
        flex: 1,
        minHeight: 0,
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          md: "minmax(0, 1fr) minmax(0, 4fr)",
        },
        gridTemplateRows: {
          xs: "minmax(0, 1fr) minmax(0, 1fr)",
          md: "minmax(0, 1fr)",
        },
      }}
    >
      <Paper
        component="aside"
        aria-labelledby="series-heading"
        square
        elevation={0}
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          minWidth: 0,
          borderRight: "1px solid #ffff",
          borderBottom: { xs: 1, md: 0 },
          borderColor: "divider",
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            id="series-heading"
            component="h2"
            variant="subtitle1"
            sx={{ fontWeight: 600 }}
          >
            Series
          </Typography>
          {data && (
            <Typography variant="body2" color="text.secondary">
              {data.series.length} series
            </Typography>
          )}
        </Box>
        <Divider />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <QueryContent
            query={query}
            loadingMessage="Loading series…"
            errorMessage="Could not load series."
            emptyMessage="No series available."
            isEmpty={data?.series.length === 0}
            blockingError={tree.error}
          >
            <SeriesTree
              nodes={tree.nodes}
              selectedId={selectedId}
              onSelect={selectSeries}
            />
          </QueryContent>
        </Box>
      </Paper>
      <Box
        component="main"
        aria-labelledby="observations-heading"
        sx={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: 0,
          overflow: "auto",
          p: { xs: 2, md: 3 },
        }}
      >
        <Typography
          id="observations-heading"
          component="h2"
          variant="h6"
          gutterBottom
        >
          Observations
        </Typography>
        {selectedSeries ? (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {selectedSeries.TX_DESCRIPTION}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Double-click an unlocked value to edit. Edits stay in this
              session.
            </Typography>
            <ObservationsLegend />
            <ObservationsGrid
              seriesId={selectedSeries.KY_ID}
              rows={rows}
              originalRows={originalRows}
              locks={locks}
              onEdit={editObservation}
              onReady={(api) => {
                gridApi.current = api;
              }}
            />
          </>
        ) : (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography color="text.secondary">
              Select a series to view its observations.
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
