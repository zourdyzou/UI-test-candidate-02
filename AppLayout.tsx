import type { PropsWithChildren } from "react";
import { Box, Typography } from "@mui/material";

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      <Box
        component="header"
        sx={{
          px: 3,
          py: 2,
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography component="h1" variant="h6">
          Series workspace
        </Typography>
      </Box>
      {children}
    </Box>
  );
}
