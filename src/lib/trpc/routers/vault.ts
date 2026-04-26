import { router, protectedProcedure } from "../init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const vaultRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        encryptedData: z.string(),
        iv: z.string(),
        authTag: z.string(),
        type: z.enum(["login", "note", "card", "identity"]),
        folderId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.vaultItem.create({
        data: {
          userId: ctx.userId,
          encryptedData: input.encryptedData,
          iv: input.iv,
          authTag: input.authTag,
          type: input.type,
          folderId: input.folderId,
        },
      });
      return { id: item.id };
    }),

  list: protectedProcedure
    .input(
      z.object({
        type: z.enum(["login", "note", "card", "identity"]).optional(),
        folderId: z.string().uuid().optional(),
        favoritesOnly: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.vaultItem.findMany({
        where: {
          userId: ctx.userId,
          ...(input?.type && { type: input.type }),
          ...(input?.folderId && { folderId: input.folderId }),
          ...(input?.favoritesOnly && { isFavorite: true }),
        },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          encryptedData: true,
          iv: true,
          authTag: true,
          type: true,
          isFavorite: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return items;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.vaultItem.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }
      return item;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        encryptedData: z.string(),
        iv: z.string(),
        authTag: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.vaultItem.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }
      await ctx.db.vaultItem.update({
        where: { id: input.id },
        data: {
          encryptedData: input.encryptedData,
          iv: input.iv,
          authTag: input.authTag,
        },
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.vaultItem.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }
      await ctx.db.vaultItem.delete({ where: { id: input.id } });
      return { success: true };
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.vaultItem.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      }
      await ctx.db.vaultItem.update({
        where: { id: input.id },
        data: { isFavorite: !item.isFavorite },
      });
      return { isFavorite: !item.isFavorite };
    }),
});
