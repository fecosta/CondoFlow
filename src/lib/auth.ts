import NextAuth, { type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";

// In-memory rate limiting: max 5 attempts per 15 minutes per email
const attemptMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = attemptMap.get(email);
  if (!entry || entry.resetAt < now) {
    attemptMap.set(email, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

interface ExtendedUser extends User {
  role: string;
  condominioId: string | null;
  condominioRole: string | null;
}

const loginSchema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const { email, password } = parsed.data;

          if (isRateLimited(email)) return null;

          const user = await prisma.user.findUnique({
            where: { email },
            include: {
              condominioUsers: {
                take: 1,
              },
            },
          });

          if (!user || !user.isActive) return null;

          const passwordOk = await bcrypt.compare(password, user.passwordHash);
          if (!passwordOk) return null;

          attemptMap.delete(email);

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          await prisma.auditLog.create({
            data: {
              action: "LOGIN",
              entity: "User",
              entityId: user.id,
              userId: user.id,
            },
          });

          const condominioUser = user.condominioUsers[0];

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as string,
            condominioId: condominioUser?.condominioId ?? null,
            condominioRole: condominioUser?.role ?? null,
          } as ExtendedUser;
        } catch (error) {
          console.error("[auth] authorize error:", error);
          return null;
        }
      },
    }),
  ],
});
