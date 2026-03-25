import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const notificacao = await prisma.notificacao.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!notificacao) return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 });

  await prisma.notificacao.update({
    where: { id: params.id },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
