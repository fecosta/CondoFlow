import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { generateToken } from "@/lib/utils";
import { sendEmailAsync } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return 200 to prevent email enumeration
  if (!user || !user.isActive) {
    return NextResponse.json({ ok: true });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiresAt: expiresAt },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  sendEmailAsync({
    to: email,
    subject: "Redefinição de senha — GCR",
    html: `
      <p>Olá, ${user.name}!</p>
      <p>Clique no link abaixo para redefinir sua senha:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Este link expira em 1 hora.</p>
      <p>Se você não solicitou a redefinição de senha, ignore este e-mail.</p>
    `,
  });

  return NextResponse.json({ ok: true });
}
