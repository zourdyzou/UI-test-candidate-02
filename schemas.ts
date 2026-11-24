import { z } from "zod";
import type { SeriesExplorerData } from "./types";

const seriesIdSchema = z.number().int().positive();
const periodSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const seriesSchema = z.object({
  KY_ID: seriesIdSchema,
  TX_DESCRIPTION: z.string(),
  TX_SKU: z.string(),
  TX_COUNTRY: z.string(),
  TX_CUSTOMER: z.string().optional(),
  TX_CATEGORY: z.string().optional(),
});

export const seriesExplorerDataSchema: z.ZodType<SeriesExplorerData> = z.object(
  {
    series: z.array(seriesSchema),
    hierarchy: z.array(
      z.object({
        FK_SERIES: seriesIdSchema,
        FK_PARENT_SERIES: z.number().int().nonnegative(),
      }),
    ),
    observations: z.array(
      z.object({
        FK_SERIES: seriesIdSchema,
        TX_PERIOD: periodSchema,
        QY_SALES: z.number().nullable(),
        QY_DEMAND: z.number().nullable(),
        QY_SUPPLY: z.number().nullable().optional(),
      }),
    ),
    lockedPeriods: z.array(
      z.object({
        FK_SERIES: seriesIdSchema,
        TX_PERIOD: periodSchema,
        TX_OPINION: z.enum(["QY_SALES", "QY_DEMAND", "QY_SUPPLY"]),
      }),
    ),
  },
);
