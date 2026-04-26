import { router, publicProcedure } from "../init";
import { authRouter } from "./auth";

export const appRouter = router({
  hello: publicProcedure.query(() => {
    return { greeting: "Hello from PassMan tRPC!" };
  }),
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
