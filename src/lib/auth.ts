import NextAuth, { type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";

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
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

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

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
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
      },
    }),
  ],
});
