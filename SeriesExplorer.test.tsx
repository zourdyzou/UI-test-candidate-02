import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import "../../app/agGrid";
import { seriesExplorerDataSource } from "./api/seriesExplorer.api";
import SeriesExplorer from "./SeriesExplorer";
import styles from "./components/ObservationsGrid/ObservationsGrid.module.css";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("edits unlocked cells, keeps locks intact, and preserves edits when switching series", async () => {
  const client = new QueryClient();
  vi.spyOn(seriesExplorerDataSource, "load").mockResolvedValue({
    series: [1, 2].map((id) => ({
      KY_ID: id,
      TX_DESCRIPTION: `Series ${id}`,
      TX_SKU: "",
      TX_COUNTRY: "",
    })),
    hierarchy: [],
    observations: [
      { FK_SERIES: 1, TX_PERIOD: "2026-01", QY_SALES: 10, QY_DEMAND: 20 },
      { FK_SERIES: 2, TX_PERIOD: "2026-01", QY_SALES: 30, QY_DEMAND: 40 },
      ...Array.from({ length: 29 }, (_, index) => ({
        FK_SERIES: 1,
        TX_PERIOD: `${2026 + Math.floor((index + 1) / 12)}-${String(((index + 1) % 12) + 1).padStart(2, "0")}`,
        QY_SALES: 1,
        QY_DEMAND: 2,
      })),
    ],
    lockedPeriods: [
      { FK_SERIES: 1, TX_PERIOD: "2026-01", TX_OPINION: "QY_SALES" },
    ],
  });
  const { container } = render(
    <QueryClientProvider client={client}>
      <SeriesExplorer />
    </QueryClientProvider>,
  );
  try {
    fireEvent.click(await screen.findByRole("treeitem", { name: "Series 1" }));
    const cell = (field: string) =>
      container.querySelector<HTMLElement>(
        `.ag-row[row-index="0"] .ag-cell[col-id="${field}"]`,
      )!;
    await waitFor(() => expect(cell("QY_DEMAND")).toHaveTextContent("20"));
    expect(screen.getByRole("list", { name: "Cell legend" })).toHaveTextContent(
      "Modified (unsaved)",
    );
    expect(cell("QY_SALES")).toHaveClass(styles.locked);
    expect(cell("QY_DEMAND")).toHaveClass(styles.editable);
    fireEvent.doubleClick(cell("QY_SALES"), { detail: 2 });
    expect(container.querySelector(".ag-cell-inline-editing")).toBeNull();
    fireEvent.doubleClick(cell("QY_DEMAND"), { detail: 2 });
    await waitFor(() =>
      expect(cell("QY_DEMAND").querySelector("input")).not.toBeNull(),
    );
    const input = cell("QY_DEMAND").querySelector("input")!;
    fireEvent.input(input, { target: { value: "123" } });
    // Switching commits the active editor, before the old grid is unmounted.
    fireEvent.click(screen.getByRole("treeitem", { name: "Series 2" }));
    await waitFor(() => expect(cell("QY_DEMAND")).toHaveTextContent("40"));
    fireEvent.click(screen.getByRole("treeitem", { name: "Series 1" }));
    await waitFor(() => expect(cell("QY_DEMAND")).toHaveTextContent("123"));
    expect(cell("QY_DEMAND")).toHaveClass(styles.modified);
    expect(cell("QY_SALES")).toHaveTextContent("10");
    expect(cell("QY_SUPPLY")).toHaveTextContent("—");
    fireEvent.click(screen.getByRole("button", { name: "Next Page" }));
    await waitFor(() =>
      expect(container.querySelector('.ag-row[row-index="25"]')).not.toBeNull(),
    );
    expect(container.querySelector('.ag-row[row-index="0"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Previous Page" }));
    await waitFor(() => expect(cell("QY_DEMAND")).toHaveTextContent("123"));
    expect(cell("QY_DEMAND")).toHaveClass(styles.modified);
    fireEvent.doubleClick(cell("QY_DEMAND"), { detail: 2 });
    await waitFor(() =>
      expect(cell("QY_DEMAND").querySelector("input")).not.toBeNull(),
    );
    const restoreInput = cell("QY_DEMAND").querySelector("input")!;
    fireEvent.input(restoreInput, { target: { value: "20" } });
    fireEvent.keyDown(restoreInput, { key: "Enter" });
    await waitFor(() => expect(cell("QY_DEMAND")).toHaveClass(styles.editable));
    expect(cell("QY_DEMAND")).not.toHaveClass(styles.modified);
    expect(cell("QY_DEMAND")).toHaveTextContent("20");
  } finally {
    cleanup();
    client.clear();
  }
});
