import type { SeriesId, SeriesTreeNode } from "./types";

export interface TreeRow {
  node: SeriesTreeNode;
  level: number;
  parentId?: SeriesId;
  position: number;
  size: number;
}

/** Iterative preorder walk: safe for deep trees, preserving sibling order. */
export function getTreeRows(
  nodes: readonly SeriesTreeNode[],
  expanded?: ReadonlySet<SeriesId>,
): TreeRow[] {
  const rows: TreeRow[] = [];
  const stack: TreeRow[] = [];
  function pushChildren(
    children: readonly SeriesTreeNode[],
    level: number,
    parentId?: SeriesId,
  ) {
    for (let index = children.length - 1; index >= 0; index--) {
      stack.push({
        node: children[index],
        level,
        parentId,
        position: index + 1,
        size: children.length,
      });
    }
  }
  pushChildren(nodes, 1);
  while (stack.length) {
    const row = stack.pop()!;
    rows.push(row);
    if (!expanded || expanded.has(row.node.series.KY_ID)) {
      pushChildren(row.node.children, row.level + 1, row.node.series.KY_ID);
    }
  }
  return rows;
}
