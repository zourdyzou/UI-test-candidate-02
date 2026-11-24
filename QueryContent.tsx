import type { ReactNode } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { match } from "ts-pattern";

interface QueryContentProps {
  query: {
    status: "pending" | "error" | "success";
    fetchStatus: "fetching" | "paused" | "idle";
    data: unknown;
    refetch: () => unknown;
  };
  loadingMessage: string;
  errorMessage: string;
  emptyMessage: string;
  isEmpty: boolean;
  /** Invalid derived data must not render, even if the request succeeded. */
  blockingError?: string | null;
  children: ReactNode;
}

export function QueryContent({
  query,
  loadingMessage,
  errorMessage,
  emptyMessage,
  isEmpty,
  blockingError,
  children,
}: QueryContentProps) {
  const errorNotice = (message: string, retry: boolean) => (
    <Alert severity="error" sx={{ m: 1 }}>
      {message}
      {retry && (
        <Button
          size="small"
          disabled={query.fetchStatus !== "idle"}
          onClick={() => void query.refetch()}
        >
          Retry
        </Button>
      )}
    </Alert>
  );
  const feedback = blockingError
    ? errorNotice(blockingError, false)
    : match(query.status)
        .with("pending", () =>
          query.fetchStatus === "paused" ? (
            <Alert severity="info" sx={{ m: 1 }}>
              Waiting for a network connection…
            </Alert>
          ) : (
            <Stack
              role="status"
              direction="row"
              spacing={1.5}
              sx={{ p: 2, alignItems: "center" }}
            >
              <CircularProgress size={20} aria-label={loadingMessage} />
              <Typography variant="body2">{loadingMessage}</Typography>
            </Stack>
          ),
        )
        .with("error", () => errorNotice(errorMessage, true))
        .with("success", () =>
          isEmpty ? (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              {emptyMessage}
            </Typography>
          ) : null,
        )
        .exhaustive();

  // Keep content in the same React position during a failed background refetch.
  // Unmounting it would discard local state such as tree expansion.
  return (
    <>
      {feedback}
      {!blockingError && query.data !== undefined && !isEmpty && children}
    </>
  );
}
