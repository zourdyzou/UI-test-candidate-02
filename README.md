# UI Dev Test

A React 18 + Vite project with TypeScript and Vitest.

## Getting started

```sh
npm ci
npm run dev
```

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run typecheck` | Check TypeScript types |
| `npm run lint` | Run ESLint for JavaScript and TypeScript |
| `npm test` | Run Vitest in watch mode |
| `npm run test:run` | Run tests once, including in CI |
| `npm run build` | Check types and build into `dist/` |
| `npm run preview` | Preview the production build |

## TypeScript and tests

Application code lives in `.ts` and `.tsx` files. TypeScript runs in
`strict` mode and supports JSON imports. Vite does not check types while
running the development server; use `npm run typecheck` or run a build.

Place tests alongside components as `*.test.tsx` (or `*.test.ts` for
logic). Vitest uses `jsdom`, React Testing Library, and
`@testing-library/jest-dom` matchers. Import `describe`, `it`, `expect`,
and `vi` directly from `vitest`. The DOM is cleaned up after each test.

Tests in `src/app/App.test.tsx` cover the series list and loading states.
Test configuration lives in `vite.config.ts`, with shared setup in
`src/test/setup.ts`.

## Data and TanStack Query

`useSeriesExplorerData()` returns the `useQuery` result: `data`,
`isPending`, `isError`, `error`, `isFetching`, and `refetch`. The data
contains `series`, `hierarchy`, `observations`, and `lockedPeriods`.
The hook requires `AppProviders`.

The local source loads files from `src/data` through dynamic imports.
All four tables form a single query result, validated by Zod before
being cached. Missing `QY_SUPPLY` fields and `null` values are preserved;
normalization will be a separate step.

To switch to a server, implement `SeriesExplorerDataSource` from
`seriesExplorer.api.ts`: provide a `cacheKey` and a `load(signal)` method
that returns an object containing the same four tables. Replace the
`seriesExplorerDataSource` export. Pass the signal to the future `fetch`
call and use a separate key for each backend or dataset.
HTTP loading is not implemented yet.

You can also pass a source to `useSeriesExplorerData(source)` or
`seriesExplorerQueryOptions(source)`, for example in tests. The query
options also support `queryClient.prefetchQuery` and `fetchQuery`.
Validation failures are not retried; other failures are retried once.

`App` combines `AppLayout` (the header and page shell) with
`SeriesExplorer`. `SeriesExplorer` uses the hook and displays all loaded
series in the left panel (20% of the desktop width). The right panel
(80%) displays observations for the selected series. On smaller screens,
the panels stack vertically.

## Material UI

The theme is defined in `src/app/theme.ts`. `AppProviders` supplies
`ThemeProvider`, `CssBaseline`, and `QueryClientProvider`. Global styles
live in `src/app/styles.css`.

## Series tree and larger datasets

`SeriesTree` provides Expand all / Collapse all controls and keyboard
navigation. With more than 100 visible nodes, TanStack Virtual renders
only the viewport, six additional rows on each side, and the row that
holds keyboard focus. Rows have a fixed height of 40 px. Long descriptions
are visually truncated, but the full text remains available in the
accessible label and the `title` tooltip.

`model/treeRows.ts` contains the iterative tree traversal, separate from
the component. Results are memoized when the data or expansion state
changes, so selection and focus changes do not rebuild the list.
Tree construction and Expand all remain O(n), and the full dataset is
still loaded. For datasets that cannot fit in memory, the next step would
be an API that loads children on demand. Virtualization limits the DOM
size, not the amount of data loaded.

## Observations and editing

AG Grid displays the month, Sales, Demand, and Supply for the selected
series. Page sizes are 25, 50, and 100. Observations are indexed by series
ID and sorted chronologically by default. Pagination is client-side and
does not change the current loading of the entire JSON file.

Double-click or press Enter to edit a number, press Escape to cancel,
and leave the cell to commit the change. An empty value represents `null`
and is displayed as `—`. Locked cells apply to the specific combination
of series, month, and column defined in `tblLockedPeriods`. Locks and
numeric validity are also checked when updating state.

Edits are stored by `useObservationEdits` in `SeriesExplorer`, separately
from the TanStack Query cache. Switching pages or series preserves edits.
Refreshing the page or unmounting the entire explorer clears them.
Saving to a server or localStorage is not implemented.

The legend above the grid identifies editable cells (blue), locked cells
(gray), and modified cells (yellow). Restoring the original value removes
the local edit and its highlight. Empty `null` values and missing fields
are treated as equivalent when comparing changes.

## Shared query states

`src/app/QueryContent.tsx` renders loading, waiting for a network
connection, error, empty, and success states. Query status matching uses
`ts-pattern` with `.exhaustive()`. The component accepts messages and an
optional `blockingError` for invalid derived data, such as a cycle in the
hierarchy. A failed refresh does not unmount existing cached content,
preserving local state such as tree expansion.
