import { router, publicProcedure, protectedProcedure } from "../init";
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
        select: { saltAuth: true, saltEnc: true, totpEnabled: true },
      });

      if (!user) {
        return {
          saltAuth: "00000000000000000000000000000000",
          saltEnc: "00000000000000000000000000000000",
          totpEnabled: false,
          exists: false,
        };
      }

      return {
        saltAuth: user.saltAuth,
        saltEnc: user.saltEnc,
        totpEnabled: user.totpEnabled,
        exists: true,
      };
    }),

  get2faStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.userId },
      select: { totpEnabled: true },
    });
    return { totpEnabled: user?.totpEnabled ?? false };
  }),

  setupTotp: protectedProcedure.mutation(async ({ ctx }) => {
    const { generateTotpSecret, generateTotpUrl, generateQrCode, encryptSecret } = 
      await import("@/lib/crypto/totp");
    
    if (!ctx.session?.user?.email) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User email not found in session" });
    }

    const secret = generateTotpSecret();
    const url = generateTotpUrl(ctx.session.user.email, secret);
    const qrCode = await generateQrCode(url);
    
    // Temporarily store secret (encrypted) until verified
    await ctx.db.user.update({
      where: { id: ctx.userId },
      data: { totpSecretEncrypted: encryptSecret(secret), totpEnabled: false },
    });

    return { qrCode, secret };
  }),

  verifyTotpSetup: protectedProcedure
    .input(z.object({ token: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const { verifyTotpToken, decryptSecret } = await import("@/lib/crypto/totp");
      
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.userId },
        select: { totpSecretEncrypted: true },
      });

      if (!user?.totpSecretEncrypted) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "TOTP not set up" });
      }

      const secret = decryptSecret(user.totpSecretEncrypted);
      const isValid = verifyTotpToken(input.token, secret);

      if (!isValid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid token" });
      }

      await ctx.db.user.update({
        where: { id: ctx.userId },
        data: { totpEnabled: true },
      });

      return { success: true };
    }),

  disableTotp: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.user.update({
      where: { id: ctx.userId },
      data: { totpEnabled: false, totpSecretEncrypted: null },
    });
    return { success: true };
  }),
});
