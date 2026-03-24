import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { z } from "zod";

const updateSchema = z.object({
  action: z.enum(["ENTRADA", "SAIDA"]),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();
  const visitante = await prisma.visitante.findFirst({
    where: { id: params.id, unidade: { bloco: { condominioId: tenantId } } },
  });
  if (!visitante) return NextResponse.json({ error: "Visitante não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const now = new Date();
  if (parsed.data.action === "ENTRADA") {
    await prisma.visitante.update({ where: { id: params.id }, data: { entryAt: now } });
  } else {
    await prisma.visitante.update({ where: { id: params.id }, data: { exitAt: now } });
  }

  return NextResponse.json({ ok: true });
}
