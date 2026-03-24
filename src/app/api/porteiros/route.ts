import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export async function GET() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const tenantId = await getTenantId();

  const porteiros = await prisma.condominioUser.findMany({
    where: { condominioId: tenantId, role: "PORTEIRO" },
    include: {
      user: { select: { id: true, name: true, email: true, isActive: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json(porteiros);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const tenantId = await getTenantId();
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const alreadyAssigned = await prisma.condominioUser.findUnique({
      where: { userId_condominioId: { userId: existing.id, condominioId: tenantId } },
    });
    if (alreadyAssigned) {
      return NextResponse.json({ error: "Usuário já vinculado a este condomínio" }, { status: 409 });
    }
    await prisma.condominioUser.create({
      data: { userId: existing.id, condominioId: tenantId, role: "PORTEIRO" },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "PORTEIRO" },
  });
  await prisma.condominioUser.create({
    data: { userId: user.id, condominioId: tenantId, role: "PORTEIRO" },
  });

  return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
}
