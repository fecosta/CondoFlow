import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const isSindico = ["SINDICO", "SUPER_ADMIN"].includes(session.user.role);
  if (!isSindico) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tenantId = await getTenantId();

  const blocos = await prisma.bloco.findMany({
    where: { condominioId: tenantId },
    include: { _count: { select: { unidades: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(blocos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const isSindico = ["SINDICO", "SUPER_ADMIN"].includes(session.user.role);
  if (!isSindico) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tenantId = await getTenantId();
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const bloco = await prisma.bloco.create({
    data: { name: parsed.data.name, condominioId: tenantId },
  });

  return NextResponse.json(bloco, { status: 201 });
}
