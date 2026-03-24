import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moradorSchema } from "@/lib/validations/condominio";
import { getTenantId } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tenantId = await getTenantId();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));
  const search = searchParams.get("search") ?? "";
  const unidadeId = searchParams.get("unidadeId");

  const where = {
    unidade: { bloco: { condominioId: tenantId } },
    isActive: true,
    ...(search ? { name: { contains: search } } : {}),
    ...(unidadeId ? { unidadeId } : {}),
  };

  const [moradores, total] = await Promise.all([
    prisma.morador.findMany({
      where,
      include: { unidade: { include: { bloco: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.morador.count({ where }),
  ]);

  return NextResponse.json({ data: moradores, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tenantId = await getTenantId();
  const body = await req.json().catch(() => ({}));
  const parsed = moradorSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Validate unidade belongs to condomínio
  const unidade = await prisma.unidade.findFirst({
    where: { id: parsed.data.unidadeId, bloco: { condominioId: tenantId } },
  });
  if (!unidade) return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });

  const morador = await prisma.morador.create({ data: parsed.data });

  // Update unidade status to OCUPADA
  await prisma.unidade.update({ where: { id: unidade.id }, data: { status: "OCUPADA" } });

  return NextResponse.json(morador, { status: 201 });
}
