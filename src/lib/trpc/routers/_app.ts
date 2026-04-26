import { router, publicProcedure } from "../init";
import { authRouter } from "./auth";
import { vaultRouter } from "./vault";
import { folderRouter } from "./folder";

export const appRouter = router({
  hello: publicProcedure.query(() => {
    return { greeting: "Hello from PassMan tRPC!" };
  }),
  auth: authRouter,
  vault: vaultRouter,
  folder: folderRouter,
});

export type AppRouter = typeof appRouter;
