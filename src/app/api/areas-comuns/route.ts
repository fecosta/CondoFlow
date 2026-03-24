import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { areaComumSchema } from "@/lib/validations/reserva";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();
  const areas = await prisma.areaComum.findMany({
    where: { condominioId: tenantId, isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(areas);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const tenantId = await getTenantId();
  const body = await req.json().catch(() => ({}));
  const parsed = areaComumSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const area = await prisma.areaComum.create({
    data: { ...parsed.data, condominioId: tenantId },
  });

  return NextResponse.json(area, { status: 201 });
}
