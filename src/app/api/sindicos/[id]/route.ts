import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
