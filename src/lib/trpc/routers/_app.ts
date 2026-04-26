import { router, publicProcedure } from "../init";

export const appRouter = router({
  hello: publicProcedure.query(() => {
    return { greeting: "Hello from PassMan tRPC!" };
  }),
});

export type AppRouter = typeof appRouter;
