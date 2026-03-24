import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moradorSchema } from "@/lib/validations/condominio";
import { getTenantId } from "@/lib/tenant";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const tenantId = await getTenantId();

  const morador = await prisma.morador.findFirst({
    where: { id: params.id, unidade: { bloco: { condominioId: tenantId } } },
    include: { unidade: { include: { bloco: true } } },
  });

  if (!morador) return NextResponse.json({ error: "Morador não encontrado" }, { status: 404 });
  return NextResponse.json(morador);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tenantId = await getTenantId();
  const body = await req.json().catch(() => ({}));
  const parsed = moradorSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const existing = await prisma.morador.findFirst({
    where: { id: params.id, unidade: { bloco: { condominioId: tenantId } } },
  });
  if (!existing) return NextResponse.json({ error: "Morador não encontrado" }, { status: 404 });

  const morador = await prisma.morador.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(morador);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tenantId = await getTenantId();
  const morador = await prisma.morador.findFirst({
    where: { id: params.id, unidade: { bloco: { condominioId: tenantId } } },
  });
  if (!morador) return NextResponse.json({ error: "Morador não encontrado" }, { status: 404 });

  await prisma.morador.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
