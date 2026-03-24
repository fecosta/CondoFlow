import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { z } from "zod";

const updateSchema = z.object({
  number: z.string().min(1).optional(),
  status: z.enum(["OCUPADA", "VAGA", "BLOQUEADA"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const tenantId = await getTenantId();
  const unidade = await prisma.unidade.findFirst({
    where: { id: params.id, bloco: { condominioId: tenantId } },
  });
  if (!unidade) return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const updated = await prisma.unidade.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const tenantId = await getTenantId();
  const unidade = await prisma.unidade.findFirst({
    where: { id: params.id, bloco: { condominioId: tenantId } },
  });
  if (!unidade) return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });

  // Check for active moradores before deleting
  const moradores = await prisma.morador.count({ where: { unidadeId: params.id, isActive: true } });
  if (moradores > 0) {
    return NextResponse.json(
      { error: "Remova os moradores desta unidade antes de excluí-la" },
      { status: 409 }
    );
  }

  await prisma.unidade.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
