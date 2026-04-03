import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  email: z.string().email("E-mail inválido").optional(),
});

// PATCH updates the síndico user info
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // params.id is the CondominioUser id
  const assignment = await prisma.condominioUser.findUnique({ where: { id: params.id } });
  if (!assignment) return NextResponse.json({ error: "Vínculo não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const updateData: { name?: string; email?: string } = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.email) {
    // Check email uniqueness
    const existing = await prisma.user.findFirst({
      where: { email: parsed.data.email, NOT: { id: assignment.userId } },
    });
    if (existing) return NextResponse.json({ error: "E-mail já em uso" }, { status: 409 });
    updateData.email = parsed.data.email;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({ where: { id: assignment.userId }, data: updateData });
  }

  return NextResponse.json({ ok: true });
}

// DELETE removes the síndico assignment (CondominioUser record)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // params.id is the CondominioUser id
  const assignment = await prisma.condominioUser.findUnique({ where: { id: params.id } });
  if (!assignment) return NextResponse.json({ error: "Vínculo não encontrado" }, { status: 404 });

  await prisma.condominioUser.delete({ where: { id: params.id } });

  // If the user has no more condomínio assignments, deactivate them
  const remaining = await prisma.condominioUser.count({ where: { userId: assignment.userId } });
  if (remaining === 0) {
    await prisma.user.update({ where: { id: assignment.userId }, data: { isActive: false } });
  }

  return NextResponse.json({ ok: true });
}
