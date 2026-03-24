import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { condominioSchema } from "@/lib/validations/condominio";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const condominio = await prisma.condominio.findUnique({
    where: { id: params.id },
    include: { blocos: { include: { unidades: { include: { moradores: true } } } } },
  });

  if (!condominio) return NextResponse.json({ error: "Condomínio não encontrado" }, { status: 404 });
  return NextResponse.json(condominio);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = condominioSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const condominio = await prisma.condominio.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(condominio);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  await prisma.condominio.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
