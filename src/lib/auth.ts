import NextAuth, { type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations/auth";

interface ExtendedUser extends User {
  role: string;
  condominioId: string | null;
  condominioRole: string | null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            condominioUsers: {
              include: { condominio: true },
              take: 1,
            },
          },
        });

        if (!user || !user.isActive) return null;

        const passwordOk = await bcrypt.compare(password, user.passwordHash);
        if (!passwordOk) return null;

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        const condominioUser = user.condominioUsers[0];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          condominioId: condominioUser?.condominioId ?? null,
          condominioRole: condominioUser?.role ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as ExtendedUser;
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
});
