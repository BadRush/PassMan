import NextAuth, { CredentialsSignin } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./lib/db";

class TotpRequiredError extends CredentialsSignin {
  code = "TOTP_REQUIRED";
}
class InvalidTotpError extends CredentialsSignin {
  code = "INVALID_TOTP";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Master Password",
      credentials: {
        email: { label: "Email", type: "email" },
        authKeyHash: { label: "Auth Key Hash", type: "password" },
        totpCode: { label: "TOTP Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.authKeyHash) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        if (user.authKeyHash !== credentials.authKeyHash) return null;

        // Verify TOTP if enabled
        if (user.totpEnabled) {
          if (!credentials.totpCode || typeof credentials.totpCode !== "string") {
            throw new TotpRequiredError();
          }

          const { verifyTotpToken, decryptSecret } = await import("@/lib/crypto/totp");
          if (!user.totpSecretEncrypted) return null;

          const secret = decryptSecret(user.totpSecretEncrypted);
          const isValid = verifyTotpToken(credentials.totpCode, secret);

          if (!isValid) {
            throw new InvalidTotpError();
          }
        }

        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
