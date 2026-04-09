import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id?: string; role?: string; condominioId?: string | null; condominioRole?: string | null };
        token.id = u.id;
        token.role = u.role;
        token.condominioId = u.condominioId;
        token.condominioRole = u.condominioRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.condominioId = token.condominioId as string | null;
        session.user.condominioRole = token.condominioRole as string | null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
