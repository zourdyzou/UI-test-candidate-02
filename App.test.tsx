import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { seriesExplorerDataSource } from "../features/series-explorer/api/seriesExplorer.api";
import App from "./App";
import { theme } from "./theme";
import "./agGrid";

const clients: QueryClient[] = [];
const emptyData = {
  series: [],
  hierarchy: [],
  observations: [],
  lockedPeriods: [],
};

function renderApp() {
  const client = new QueryClient({
    defaultOptions: { queries: { retryDelay: 0 } },
  });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.restoreAllMocks();
});

describe("App", () => {
  it("loads the hierarchy and expands a root to show its children", async () => {
    vi.spyOn(seriesExplorerDataSource, "load").mockResolvedValue({
      ...emptyData,
      series: [
        { KY_ID: 1, TX_DESCRIPTION: "[CA]", TX_SKU: "", TX_COUNTRY: "CA" },
        {
          KY_ID: 2,
          TX_DESCRIPTION: "[CA] [Store] [S3]",
          TX_SKU: "S3",
          TX_COUNTRY: "CA",
        },
      ],
      hierarchy: [
        { FK_SERIES: 1, FK_PARENT_SERIES: 0 },
        { FK_SERIES: 2, FK_PARENT_SERIES: 1 },
      ],
    });
    renderApp();
    expect(screen.getByRole("status")).toHaveTextContent("Loading series");
    const tree = await screen.findByRole("tree", { name: "Series" });
    expect(within(tree).getAllByRole("treeitem")).toHaveLength(1);
    fireEvent.click(screen.getByRole("treeitem", { name: "[CA]" }));
    expect(within(tree).getAllByRole("treeitem")).toHaveLength(2);
    expect(
      within(screen.getByRole("complementary")).getByText("[CA] [Store] [S3]"),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Observations");
  });

  it("shows an empty state when there are no series", async () => {
    vi.spyOn(seriesExplorerDataSource, "load").mockResolvedValue(emptyData);
    renderApp();
    expect(await screen.findByText("No series available.")).toBeInTheDocument();
  });

  it("lets the user retry a failed load", async () => {
    const load = vi
      .spyOn(seriesExplorerDataSource, "load")
      .mockRejectedValue(new Error("Unavailable"));
    renderApp();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not load series.",
    );
    load.mockResolvedValue(emptyData);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("No series available.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
