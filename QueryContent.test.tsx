import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { QueryContent } from "./QueryContent";

const messages = {
  loadingMessage: "Loading records…",
  errorMessage: "Could not load records.",
  emptyMessage: "No records.",
};
const query = {
  status: "success" as const,
  fetchStatus: "idle" as const,
  data: [],
  refetch: vi.fn(),
};

function StatefulContent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Count {count}</button>;
}

it("preserves cached content and its local state after a refresh failure", () => {
  const { rerender } = render(
    <QueryContent {...messages} query={query} isEmpty={false}>
      <StatefulContent />
    </QueryContent>,
  );
  fireEvent.click(screen.getByText("Count 0"));
  rerender(
    <QueryContent
      {...messages}
      query={{ ...query, status: "error" }}
      isEmpty={false}
    >
      <StatefulContent />
    </QueryContent>,
  );
  expect(screen.getByText("Count 1")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(messages.errorMessage);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(query.refetch).toHaveBeenCalledOnce();
});

it("distinguishes loading, paused, empty and invalid data", () => {
  const { rerender } = render(
    <QueryContent
      {...messages}
      query={{ ...query, status: "pending", data: undefined }}
      isEmpty={false}
    >
      Content
    </QueryContent>,
  );
  expect(screen.getByRole("status")).toHaveTextContent(messages.loadingMessage);
  rerender(
    <QueryContent
      {...messages}
      query={{
        ...query,
        status: "pending",
        fetchStatus: "paused",
        data: undefined,
      }}
      isEmpty={false}
    >
      Content
    </QueryContent>,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Waiting for a network connection",
  );
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  rerender(
    <QueryContent {...messages} query={query} isEmpty>
      Content
    </QueryContent>,
  );
  expect(screen.getByText(messages.emptyMessage)).toBeInTheDocument();
  expect(screen.queryByText("Content")).not.toBeInTheDocument();
  rerender(
    <QueryContent
      {...messages}
      query={query}
      isEmpty={false}
      blockingError="Invalid hierarchy"
    >
      Content
    </QueryContent>,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Invalid hierarchy");
  expect(screen.queryByText("Content")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Retry" }),
  ).not.toBeInTheDocument();
});
