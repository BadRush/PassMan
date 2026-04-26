import { router, publicProcedure } from "../init";
import { authRouter } from "./auth";
import { vaultRouter } from "./vault";

export const appRouter = router({
  hello: publicProcedure.query(() => {
    return { greeting: "Hello from PassMan tRPC!" };
  }),
  auth: authRouter,
  vault: vaultRouter,
});

export type AppRouter = typeof appRouter;
