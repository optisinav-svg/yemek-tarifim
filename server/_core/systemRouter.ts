import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

import { pool } from "../../server/db";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      }),
    )
    .query(async () => {
      try {
        const res = await pool.query("SELECT NOW() as now, version() as version");
        return {
          ok: true,
          dbConnected: true,
          dbTime: res.rows[0]?.now,
          dbVersion: res.rows[0]?.version,
        };
      } catch (err: any) {
        return {
          ok: false,
          dbConnected: false,
          error: err?.message ?? String(err),
        };
      }
    }),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      }),
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
