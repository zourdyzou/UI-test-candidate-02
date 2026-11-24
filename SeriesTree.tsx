import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Box, Button, ButtonBase, Stack } from "@mui/material";
import {
  defaultRangeExtractor,
  useVirtualizer,
  type Range,
} from "@tanstack/react-virtual";
import { getTreeRows, type TreeRow } from "../../model/treeRows";
import type { SeriesId, SeriesTreeNode } from "../../model/types";
import styles from "./SeriesTree.module.css";

interface SeriesTreeProps {
  nodes: readonly SeriesTreeNode[];
  selectedId?: SeriesId;
  onSelect: (id: SeriesId) => void;
}

const ROW_HEIGHT = 40;
const VIRTUALIZE_ABOVE = 100;

export function SeriesTree({ nodes, selectedId, onSelect }: SeriesTreeProps) {
  const [expanded, setExpanded] = useState<Set<SeriesId>>(() => new Set());
  const [focusedId, setFocusedId] = useState<SeriesId>();
  const buttons = useRef(new Map<SeriesId, HTMLButtonElement>());
  const scrollElement = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<SeriesId>();
  const branchIds = useMemo(
    () =>
      new Set(
        getTreeRows(nodes)
          .filter(({ node }) => node.children.length > 0)
          .map(({ node }) => node.series.KY_ID),
      ),
    [nodes],
  );
  const visible = useMemo(
    () => getTreeRows(nodes, expanded),
    [nodes, expanded],
  );
  const indexes = useMemo(
    () => new Map(visible.map(({ node }, index) => [node.series.KY_ID, index])),
    [visible],
  );
  const focusIndex =
    (focusedId === undefined ? undefined : indexes.get(focusedId)) ?? 0;
  const tabStop = visible[focusIndex]?.node.series.KY_ID;
  const virtualized = visible.length > VIRTUALIZE_ABOVE;
  const getItemKey = useCallback(
    (index: number) => visible[index].node.series.KY_ID,
    [visible],
  );
  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => scrollElement.current,
    estimateSize: () => ROW_HEIGHT,
    getItemKey,
    overscan: 6,
    enabled: virtualized,
    // Keep the keyboard tab stop mounted, even when scrolled out of view.
    rangeExtractor: useCallback(
      (range: Range) => {
        const indexes = defaultRangeExtractor(range);
        if (!indexes.includes(focusIndex)) indexes.push(focusIndex);
        return indexes.sort((a, b) => a - b);
      },
      [focusIndex],
    ),
  });
  const renderedRows = virtualized
    ? virtualizer
        .getVirtualItems()
        .map((item) => ({ index: item.index, start: item.start }))
    : visible.map((_, index) => ({ index, start: index * ROW_HEIGHT }));

  useLayoutEffect(() => {
    if (pendingFocus.current !== undefined) {
      buttons.current.get(pendingFocus.current)?.focus({ preventScroll: true });
      pendingFocus.current = undefined;
    }
  });

  function focusRow(id: SeriesId) {
    const index = indexes.get(id);
    if (index === undefined) return;
    if (virtualized) virtualizer.scrollToIndex(index, { align: "auto" });
    else buttons.current.get(id)?.scrollIntoView?.({ block: "nearest" });
    pendingFocus.current = id;
    setFocusedId(id);
  }

  function collapseAll() {
    setExpanded(new Set());
    setFocusedId(nodes[0]?.series.KY_ID);
    if (scrollElement.current) scrollElement.current.scrollTop = 0;
  }

  function toggle(id: SeriesId) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleKey(event: KeyboardEvent, item: TreeRow, index: number) {
    const id = item.node.series.KY_ID;
    let target: SeriesId | undefined;
    switch (event.key) {
      case "ArrowDown":
        target = visible[index + 1]?.node.series.KY_ID;
        break;
      case "ArrowUp":
        target = visible[index - 1]?.node.series.KY_ID;
        break;
      case "Home":
        target = visible[0]?.node.series.KY_ID;
        break;
      case "End":
        target = visible[visible.length - 1]?.node.series.KY_ID;
        break;
      case "ArrowRight":
        if (item.node.children.length && !expanded.has(id)) toggle(id);
        else target = item.node.children[0]?.series.KY_ID;
        break;
      case "ArrowLeft":
        if (expanded.has(id)) toggle(id);
        else target = item.parentId;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (target !== undefined) focusRow(target);
  }

  return (
    <Box className={styles.container}>
      <Stack
        direction="row"
        sx={{ px: 1, py: 0.5, flexWrap: "wrap", flexShrink: 0, gap: '1rem' }}
      >
        <Button
          variant="outlined"
          size="small"
          disabled={branchIds.size === 0 || expanded === branchIds}
          onClick={() => setExpanded(branchIds)}
        >
          Expand all
        </Button>
        <Button
          variant="outlined"
          size="small"
          disabled={expanded.size === 0}
          onClick={collapseAll}
        >
          Collapse all
        </Button>
      </Stack>
      <Box
        ref={scrollElement}
        role="tree"
        aria-label="Series"
        className={styles.tree}
      >
        <div
          className={styles.rows}
          style={{ height: visible.length * ROW_HEIGHT }}
        >
          {renderedRows.map(({ index, start }) => {
            const item = visible[index];
            const { node, level, position, size } = item;
            const id = node.series.KY_ID;
            const hasChildren = node.children.length > 0;
            return (
              <ButtonBase
                key={id}
                ref={(element: HTMLButtonElement | null) => {
                  if (element) buttons.current.set(id, element);
                  else buttons.current.delete(id);
                }}
                role="treeitem"
                aria-label={node.series.TX_DESCRIPTION}
                aria-level={level}
                aria-posinset={position}
                aria-setsize={size}
                aria-expanded={hasChildren ? expanded.has(id) : undefined}
                aria-selected={selectedId === id}
                tabIndex={tabStop === id ? 0 : -1}
                onFocus={() => setFocusedId(id)}
                onKeyDown={(event) => handleKey(event, item, index)}
                onClick={() => {
                  onSelect(id);
                  if (hasChildren) toggle(id);
                }}
                className={styles.item}
                title={node.series.TX_DESCRIPTION}
                style={{
                  height: ROW_HEIGHT,
                  transform: `translateY(${start}px)`,
                  paddingLeft: 8 + Math.min(level - 1, 12) * 16,
                }}
                sx={{
                  bgcolor: selectedId === id ? "action.selected" : undefined,
                }}
              >
                <span aria-hidden="true" className={styles.indicator}>
                  {hasChildren ? (expanded.has(id) ? "▾" : "▸") : "·"}
                </span>
                <span className={styles.label}>
                  {node.series.TX_DESCRIPTION}
                </span>
              </ButtonBase>
            );
          })}
        </div>
      </Box>
    </Box>
  );
}
