import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  condominioId: z.string().min(1, "Condomínio obrigatório"),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const sindicos = await prisma.condominioUser.findMany({
    where: { role: "SINDICO" },
    include: {
      user: { select: { id: true, name: true, email: true, isActive: true } },
      condominio: { select: { id: true, name: true } },
    },
    orderBy: { condominio: { name: "asc" } },
  });

  return NextResponse.json(sindicos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, password, condominioId } = parsed.data;

  const condominio = await prisma.condominio.findUnique({ where: { id: condominioId } });
  if (!condominio) return NextResponse.json({ error: "Condomínio não encontrado" }, { status: 404 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // If user exists, just assign them as síndico of this condomínio
    const alreadyAssigned = await prisma.condominioUser.findUnique({
      where: { userId_condominioId: { userId: existing.id, condominioId } },
    });
    if (alreadyAssigned) {
      return NextResponse.json({ error: "Usuário já vinculado a este condomínio" }, { status: 409 });
    }
    await prisma.condominioUser.create({
      data: { userId: existing.id, condominioId, role: "SINDICO" },
    });
    await prisma.user.update({ where: { id: existing.id }, data: { role: "SINDICO" } });
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "SINDICO" },
  });
  await prisma.condominioUser.create({
    data: { userId: user.id, condominioId, role: "SINDICO" },
  });

  return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
}
