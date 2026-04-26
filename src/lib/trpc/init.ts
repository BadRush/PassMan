import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { db } from "../db";

export const createTRPCContext = async (opts: { req?: Request }) => {
  return {
    db,
    req: opts.req,
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
