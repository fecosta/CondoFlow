import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const blocoSchema = z.object({ name: z.string().min(1, "Nome obrigatório") });

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const blocos = await prisma.bloco.findMany({
    where: { condominioId: params.id },
    include: { _count: { select: { unidades: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(blocos);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = blocoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const bloco = await prisma.bloco.create({ data: { ...parsed.data, condominioId: params.id } });
  return NextResponse.json(bloco, { status: 201 });
}
