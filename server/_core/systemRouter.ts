import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { z } from "zod";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      }),
    )
    .query(async () => {
      let dbStatus = { connected: false, error: null as string | null };
      try {
        const { Pool } = await import("pg");
        const tempPool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 5000,
        });
        await tempPool.query("SELECT 1");
        await tempPool.end();
        dbStatus.connected = true;
      } catch (err: any) {
        dbStatus.error = err?.message || String(err);
      }

      return {
        ok: true,
        dbStatus,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        dbUrlPreview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 25) + "..." : "MISSING",
      };
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
