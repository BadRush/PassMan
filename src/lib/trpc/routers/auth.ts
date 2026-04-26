import { router, publicProcedure } from "../init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        authKeyHash: z.string().min(64),
        saltAuth: z.string().min(32),
        saltEnc: z.string().min(32),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          authKeyHash: input.authKeyHash,
          saltAuth: input.saltAuth,
          saltEnc: input.saltEnc,
          encryptedPrivateKey: "TBD", // To be updated during RSA setup
          publicKey: "TBD",           // To be updated during RSA setup
        },
      });

      return { success: true, userId: user.id };
    }),

  getSalts: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
        select: { saltAuth: true, saltEnc: true },
      });

      if (!user) {
        // Return dummy salts to prevent timing/enumeration attacks
        return {
          saltAuth: "00000000000000000000000000000000",
          saltEnc: "00000000000000000000000000000000",
          exists: false,
        };
      }

      return {
        saltAuth: user.saltAuth,
        saltEnc: user.saltEnc,
        exists: true,
      };
    }),
});
