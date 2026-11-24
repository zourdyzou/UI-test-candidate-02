import { describe, expect, it } from "vitest";
import { buildTree } from "./buildTree";
import { getTreeRows } from "./treeRows";

describe("getTreeRows", () => {
  it("handles a 20,000-level hierarchy without recursive stack overflow", () => {
    const series = Array.from({ length: 20000 }, (_, index) => ({
      KY_ID: index + 1,
      TX_DESCRIPTION: String(index),
      TX_COUNTRY: "",
      TX_SKU: "",
    }));
    const nodes = buildTree(
      series,
      series.map(({ KY_ID }) => ({
        FK_SERIES: KY_ID,
        FK_PARENT_SERIES: KY_ID - 1,
      })),
    );
    const all = getTreeRows(nodes);
    expect(all).toHaveLength(20000);
    expect(all[19999]).toMatchObject({
      level: 20000,
      parentId: 19999,
      position: 1,
      size: 1,
    });
    expect(getTreeRows(nodes, new Set())).toHaveLength(1);
    expect(
      getTreeRows(nodes, new Set([1, 2])).map(({ node }) => node.series.KY_ID),
    ).toEqual([1, 2, 3]);
  });
});
