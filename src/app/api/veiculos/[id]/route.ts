import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { z } from "zod";

const schema = z.object({
  plate: z.string().min(1).optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  parkingSpot: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const tenantId = await getTenantId();
  const veiculo = await prisma.veiculo.findFirst({
    where: { id: params.id, unidade: { bloco: { condominioId: tenantId } } },
  });
  if (!veiculo) return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const updated = await prisma.veiculo.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const tenantId = await getTenantId();
  const veiculo = await prisma.veiculo.findFirst({
    where: { id: params.id, unidade: { bloco: { condominioId: tenantId } } },
  });
  if (!veiculo) return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 });

  await prisma.veiculo.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
