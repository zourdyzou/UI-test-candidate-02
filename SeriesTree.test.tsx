import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildTree } from "../../model/buildTree";
import { SeriesTree } from "./SeriesTree";

const nodes = buildTree(
  [1, 2, 3].map((id) => ({
    KY_ID: id,
    TX_DESCRIPTION: `Series ${id}`,
    TX_COUNTRY: "",
    TX_SKU: "",
  })),
  [
    { FK_SERIES: 1, FK_PARENT_SERIES: 0 },
    { FK_SERIES: 2, FK_PARENT_SERIES: 1 },
    { FK_SERIES: 3, FK_PARENT_SERIES: 2 },
  ],
);

function Tree() {
  const [selectedId, onSelect] = useState<number>();
  return (
    <SeriesTree nodes={nodes} selectedId={selectedId} onSelect={onSelect} />
  );
}

describe("SeriesTree", () => {
  it("expands all levels and collapses them without clearing selection", () => {
    render(<Tree />);
    expect(screen.getByRole("button", { name: "Collapse all" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getAllByRole("treeitem")).toHaveLength(3);
    fireEvent.click(screen.getByRole("treeitem", { name: "Series 3" }));
    fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(screen.getAllByRole("treeitem")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getByRole("treeitem", { name: "Series 3" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("keeps rendered rows bounded after expanding 20,000 children and focuses an offscreen row", () => {
    const height = vi
      .spyOn(HTMLElement.prototype, "clientHeight", "get")
      .mockReturnValue(400);
    const width = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockReturnValue(300);
    const scrollTo = vi.fn();
    const originalScrollTo = HTMLElement.prototype.scrollTo;
    HTMLElement.prototype.scrollTo = scrollTo;
    const largeNodes = buildTree(
      Array.from({ length: 20001 }, (_, id) => ({
        KY_ID: id + 1,
        TX_DESCRIPTION: `Large ${id + 1}`,
        TX_COUNTRY: "",
        TX_SKU: "",
      })),
      Array.from({ length: 20000 }, (_, id) => ({
        FK_SERIES: id + 2,
        FK_PARENT_SERIES: 1,
      })),
    );
    try {
      render(<SeriesTree nodes={largeNodes} onSelect={() => undefined} />);
      fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
      expect(screen.getAllByRole("treeitem").length).toBeGreaterThan(1);
      expect(screen.getAllByRole("treeitem").length).toBeLessThan(40);
      fireEvent.keyDown(screen.getByRole("treeitem", { name: "Large 1" }), {
        key: "End",
      });
      expect(
        screen.getByRole("treeitem", { name: "Large 20001" }),
      ).toHaveFocus();
      expect(scrollTo).toHaveBeenCalled();
      expect(screen.getAllByRole("treeitem").length).toBeLessThan(40);
      fireEvent.scroll(screen.getByRole("tree"), {
        target: { scrollTop: 400000 },
      });
      expect(
        screen.getByRole("treeitem", { name: "Large 10001" }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("treeitem").length).toBeLessThan(40);
      fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));
      expect(screen.getAllByRole("treeitem")).toHaveLength(1);
      expect(screen.getByRole("treeitem")).toHaveAttribute("tabindex", "0");
    } finally {
      height.mockRestore();
      width.mockRestore();
      HTMLElement.prototype.scrollTo = originalScrollTo;
    }
  });

  it("expands and collapses branches, preserves nested expansion and selects leaves", () => {
    render(<Tree />);
    const root = screen.getByRole("treeitem", { name: "Series 1" });
    expect(root).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(root);
    fireEvent.click(screen.getByRole("treeitem", { name: "Series 2" }));
    const leaf = screen.getByRole("treeitem", { name: "Series 3" });
    expect(leaf).not.toHaveAttribute("aria-expanded");
    fireEvent.click(leaf);
    expect(leaf).toHaveAttribute("aria-selected", "true");
    fireEvent.click(root);
    expect(
      screen.queryByRole("treeitem", { name: "Series 3" }),
    ).not.toBeInTheDocument();
    fireEvent.click(root);
    expect(
      screen.getByRole("treeitem", { name: "Series 3" }),
    ).toBeInTheDocument();
  });

  it("supports keyboard navigation and returns focus to a parent", () => {
    render(<Tree />);
    const root = screen.getByRole("treeitem", { name: "Series 1" });
    fireEvent.keyDown(root, { key: "ArrowRight" });
    fireEvent.keyDown(root, { key: "ArrowDown" });
    const child = screen.getByRole("treeitem", { name: "Series 2" });
    expect(child).toHaveFocus();
    fireEvent.keyDown(child, { key: "ArrowRight" });
    fireEvent.keyDown(child, { key: "End" });
    const leaf = screen.getByRole("treeitem", { name: "Series 3" });
    expect(leaf).toHaveFocus();
    fireEvent.keyDown(leaf, { key: "ArrowLeft" });
    expect(child).toHaveFocus();
    fireEvent.keyDown(child, { key: "ArrowLeft" });
    expect(child).toHaveAttribute("aria-expanded", "false");
    fireEvent.keyDown(child, { key: "Home" });
    expect(root).toHaveFocus();
    expect(root).toHaveAttribute("tabindex", "0");
    expect(child).toHaveAttribute("tabindex", "-1");
  });
});
