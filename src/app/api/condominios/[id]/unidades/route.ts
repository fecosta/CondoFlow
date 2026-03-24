import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unidadeSchema } from "@/lib/validations/condominio";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));
  const blocoId = searchParams.get("blocoId");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {
    bloco: { condominioId: params.id },
    ...(blocoId ? { blocoId } : {}),
    ...(status ? { status } : {}),
  };

  const [unidades, total] = await Promise.all([
    prisma.unidade.findMany({
      where,
      include: {
        bloco: true,
        moradores: { where: { isActive: true } },
        _count: { select: { encomendas: true } },
      },
      orderBy: [{ bloco: { name: "asc" } }, { number: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.unidade.count({ where }),
  ]);

  return NextResponse.json({ data: unidades, total, page, limit });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = unidadeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Validate bloco belongs to condomínio
  const bloco = await prisma.bloco.findFirst({ where: { id: parsed.data.blocoId, condominioId: params.id } });
  if (!bloco) return NextResponse.json({ error: "Bloco não encontrado" }, { status: 404 });

  const unidade = await prisma.unidade.create({ data: parsed.data });
  return NextResponse.json(unidade, { status: 201 });
}
