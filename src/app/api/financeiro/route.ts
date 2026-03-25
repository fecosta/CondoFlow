import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const isSindico = ["SINDICO", "SUPER_ADMIN"].includes(session.user.role);
  if (!isSindico) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tenantId = await getTenantId();
  const { searchParams } = new URL(req.url);
  const statusFinanceiro = searchParams.get("statusFinanceiro");
  const blocoId = searchParams.get("blocoId");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 20;

  const where: Record<string, unknown> = {
    bloco: { condominioId: tenantId },
    ...(statusFinanceiro ? { statusFinanceiro } : {}),
    ...(blocoId ? { blocoId } : {}),
  };

  const [unidades, total] = await Promise.all([
    prisma.unidade.findMany({
      where,
      include: {
        bloco: { select: { id: true, name: true } },
        moradores: { where: { isActive: true }, select: { id: true, name: true, vinculo: true } },
      },
      orderBy: [{ bloco: { name: "asc" } }, { number: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.unidade.count({ where }),
  ]);

  return NextResponse.json({ data: unidades, total, page, limit });
}
