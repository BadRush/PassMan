import { z } from "zod";
import { router, protectedProcedure } from "../init";

export const folderRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.folder.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { sortOrder: "asc" },
    });
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Find max sortOrder
      const last = await ctx.db.folder.findFirst({
        where: { userId: ctx.session.user.id },
        orderBy: { sortOrder: "desc" },
      });
      const sortOrder = (last?.sortOrder ?? -1) + 1;

      return ctx.db.folder.create({
        data: {
          userId: ctx.session.user.id,
          name: input.name,
          sortOrder,
        },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.folder.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: { name: input.name },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Deleting folder will SetNull for items because of onDelete: SetNull in schema
      return ctx.db.folder.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),

  reorder: protectedProcedure
    .input(z.array(z.object({ id: z.string(), sortOrder: z.number() })))
    .mutation(async ({ ctx, input }) => {
      // Update each folder's sort order in a transaction
      const updates = input.map((folder) =>
        ctx.db.folder.update({
          where: { id: folder.id, userId: ctx.session.user.id },
          data: { sortOrder: folder.sortOrder },
        })
      );
      return ctx.db.$transaction(updates);
    }),
});
