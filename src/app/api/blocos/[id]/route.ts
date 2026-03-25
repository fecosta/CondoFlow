import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !["SINDICO", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const tenantId = await getTenantId();
  const bloco = await prisma.bloco.findFirst({ where: { id: params.id, condominioId: tenantId } });
  if (!bloco) return NextResponse.json({ error: "Bloco não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updated = await prisma.bloco.update({ where: { id: params.id }, data: { name: parsed.data.name } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !["SINDICO", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const tenantId = await getTenantId();
  const bloco = await prisma.bloco.findFirst({
    where: { id: params.id, condominioId: tenantId },
    include: { _count: { select: { unidades: true } } },
  });
  if (!bloco) return NextResponse.json({ error: "Bloco não encontrado" }, { status: 404 });

  if (bloco._count.unidades > 0) {
    return NextResponse.json({ error: `Não é possível remover: bloco possui ${bloco._count.unidades} unidade(s).` }, { status: 409 });
  }

  await prisma.bloco.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
