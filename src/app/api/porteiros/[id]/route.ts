import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const tenantId = await getTenantId();

  // params.id is the CondominioUser id
  const assignment = await prisma.condominioUser.findFirst({
    where: { id: params.id, condominioId: tenantId, role: "PORTEIRO" },
  });
  if (!assignment) return NextResponse.json({ error: "Porteiro não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  if (parsed.data.name) {
    await prisma.user.update({ where: { id: assignment.userId }, data: { name: parsed.data.name } });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const tenantId = await getTenantId();

  const assignment = await prisma.condominioUser.findFirst({
    where: { id: params.id, condominioId: tenantId, role: "PORTEIRO" },
  });
  if (!assignment) return NextResponse.json({ error: "Porteiro não encontrado" }, { status: 404 });

  await prisma.condominioUser.delete({ where: { id: params.id } });

  const remaining = await prisma.condominioUser.count({ where: { userId: assignment.userId } });
  if (remaining === 0) {
    await prisma.user.update({ where: { id: assignment.userId }, data: { isActive: false } });
  }

  return NextResponse.json({ ok: true });
}
