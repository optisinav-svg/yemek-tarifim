import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      }),
    )
    .query(async () => {
      let dbStatus = { connected: false, error: null as string | null, userCount: 0 };
      try {
        const db = await getDb();
        if (!db) {
          dbStatus.error = "getDb() returned null";
        } else {
          const rows = await db.select().from(users).limit(1);
          dbStatus.connected = true;
          dbStatus.userCount = rows.length;
        }
      } catch (err: any) {
        dbStatus.error = `Code: ${err?.code || 'UNKNOWN'} | Msg: ${err?.message || String(err)} | Detail: ${err?.detail || ''}`;
      }
      return {
        ok: true,
        dbStatus,
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
