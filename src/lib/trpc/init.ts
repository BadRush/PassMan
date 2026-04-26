import { TRPCError } from "@trpc/server";
import { auth } from "@/auth";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { db } from "../db";

// Re-create context with session
export const createTRPCContext = async (opts: { req?: Request }) => {
  const session = await auth();
  return {
    db,
    req: opts.req,
    session,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.session.user.id,
    },
  });
});
