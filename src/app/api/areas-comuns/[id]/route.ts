import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { areaComumSchema } from "@/lib/validations/reserva";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();
  const area = await prisma.areaComum.findFirst({
    where: { id: params.id, condominioId: tenantId },
  });

  if (!area) return NextResponse.json({ error: "Área não encontrada" }, { status: 404 });
  return NextResponse.json(area);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const tenantId = await getTenantId();
  const area = await prisma.areaComum.findFirst({ where: { id: params.id, condominioId: tenantId } });
  if (!area) return NextResponse.json({ error: "Área não encontrada" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = areaComumSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const updated = await prisma.areaComum.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const tenantId = await getTenantId();
  const area = await prisma.areaComum.findFirst({ where: { id: params.id, condominioId: tenantId } });
  if (!area) return NextResponse.json({ error: "Área não encontrada" }, { status: 404 });

  // Soft delete
  await prisma.areaComum.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
