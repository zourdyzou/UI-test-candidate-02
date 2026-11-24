import type {
  Series,
  SeriesHierarchy,
  SeriesId,
  SeriesTreeNode,
} from "./types";

/** Preserve source order; missing parents and unlinked series become roots. */
export function buildTree(
  series: readonly Series[],
  hierarchy: readonly SeriesHierarchy[],
): SeriesTreeNode[] {
  const nodes = new Map<SeriesId, SeriesTreeNode>();
  for (const item of series) {
    if (nodes.has(item.KY_ID))
      throw new Error(`Duplicate series ID: ${item.KY_ID}`);
    nodes.set(item.KY_ID, { series: item, children: [] });
  }
  const parents = new Map<SeriesId, SeriesId>();
  for (const link of hierarchy) {
    if (!nodes.has(link.FK_SERIES)) continue;
    if (parents.has(link.FK_SERIES))
      throw new Error(
        `Multiple hierarchy entries for series ${link.FK_SERIES}`,
      );
    parents.set(link.FK_SERIES, link.FK_PARENT_SERIES);
  }

  // Validate parent chains before linking, including cycles with no root.
  const checked = new Set<SeriesId>();
  for (const id of nodes.keys()) {
    const path = new Set<SeriesId>();
    let current = id;
    while (nodes.has(current) && !checked.has(current)) {
      if (path.has(current))
        throw new Error("The series hierarchy contains a cycle.");
      path.add(current);
      current = parents.get(current) ?? 0;
    }
    path.forEach((entry) => checked.add(entry));
  }

  const roots: SeriesTreeNode[] = [];
  for (const [id, node] of nodes) {
    const parent = nodes.get(parents.get(id) ?? 0);
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}
