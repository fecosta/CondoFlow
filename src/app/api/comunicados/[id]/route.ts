import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { comunicadoSchema } from "@/lib/validations/comunicado";
import { getTenantId } from "@/lib/tenant";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();

  const comunicado = await prisma.comunicado.findFirst({
    where: { id: params.id, condominioId: tenantId },
    include: {
      reads: { select: { userId: true } },
      _count: { select: { reads: true } },
    },
  });

  if (!comunicado) return NextResponse.json({ error: "Comunicado não encontrado" }, { status: 404 });

  // Auto-register read for moradores
  if (session.user.role === "MORADOR") {
    await prisma.comunicadoRead.upsert({
      where: { comunicadoId_userId: { comunicadoId: params.id, userId: session.user.id } },
      create: { comunicadoId: params.id, userId: session.user.id },
      update: {},
    });
  }

  return NextResponse.json(comunicado);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tenantId = await getTenantId();
  const body = await req.json().catch(() => ({}));
  const parsed = comunicadoSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const existing = await prisma.comunicado.findFirst({ where: { id: params.id, condominioId: tenantId } });
  if (!existing) return NextResponse.json({ error: "Comunicado não encontrado" }, { status: 404 });

  const comunicado = await prisma.comunicado.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(comunicado);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tenantId = await getTenantId();
  const existing = await prisma.comunicado.findFirst({ where: { id: params.id, condominioId: tenantId } });
  if (!existing) return NextResponse.json({ error: "Comunicado não encontrado" }, { status: 404 });

  await prisma.comunicado.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
