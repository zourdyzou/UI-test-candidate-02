import { describe, expect, it } from "vitest";
import { buildTree } from "./buildTree";
import type { Series } from "./types";

const series = (id: number): Series => ({
  KY_ID: id,
  TX_DESCRIPTION: `Series ${id}`,
  TX_COUNTRY: "",
  TX_SKU: "",
});

describe("buildTree", () => {
  it("links unordered records across multiple levels without changing inputs", () => {
    const records = [series(3), series(1), series(2), series(4)];
    const links = [
      { FK_SERIES: 3, FK_PARENT_SERIES: 2 },
      { FK_SERIES: 2, FK_PARENT_SERIES: 1 },
      { FK_SERIES: 1, FK_PARENT_SERIES: 0 },
      { FK_SERIES: 4, FK_PARENT_SERIES: 0 },
    ];
    const snapshot = structuredClone({ records, links });
    const tree = buildTree(records, links);
    expect(tree.map((node) => node.series.KY_ID)).toEqual([1, 4]);
    expect(tree[0].children[0].children[0].series.KY_ID).toBe(3);
    expect({ records, links }).toEqual(snapshot);
  });

  it("keeps orphan and unlinked series visible and ignores links to missing series", () => {
    expect(
      buildTree(
        [series(1), series(2)],
        [
          { FK_SERIES: 1, FK_PARENT_SERIES: 99 },
          { FK_SERIES: 99, FK_PARENT_SERIES: 1 },
        ],
      ).map((node) => node.series.KY_ID),
    ).toEqual([1, 2]);
    expect(buildTree([], [])).toEqual([]);
  });

  it("rejects cycles, including disconnected cycles and self references", () => {
    expect(() =>
      buildTree(
        [series(1), series(2), series(3)],
        [
          { FK_SERIES: 2, FK_PARENT_SERIES: 3 },
          { FK_SERIES: 3, FK_PARENT_SERIES: 2 },
        ],
      ),
    ).toThrow("cycle");
    expect(() =>
      buildTree([series(1)], [{ FK_SERIES: 1, FK_PARENT_SERIES: 1 }]),
    ).toThrow("cycle");
  });

  it("rejects ambiguous duplicate IDs and hierarchy entries", () => {
    expect(() => buildTree([series(1), series(1)], [])).toThrow("Duplicate");
    expect(() =>
      buildTree(
        [series(1)],
        [
          { FK_SERIES: 1, FK_PARENT_SERIES: 0 },
          { FK_SERIES: 1, FK_PARENT_SERIES: 2 },
        ],
      ),
    ).toThrow("Multiple");
  });
});
