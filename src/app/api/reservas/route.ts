import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { reservaSchema } from "@/lib/validations/reserva";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const areaComumId = searchParams.get("areaComumId");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 20;

  // Moradores only see their own reservas
  const isMorador = session.user.role === "MORADOR";

  const where: Record<string, unknown> = {
    areaComum: { condominioId: tenantId },
    ...(status ? { status } : {}),
    ...(areaComumId ? { areaComumId } : {}),
    ...(isMorador ? { userId: session.user.id } : {}),
  };

  const [reservas, total] = await Promise.all([
    prisma.reserva.findMany({
      where,
      include: {
        areaComum: { select: { id: true, name: true } },
        unidade: { include: { bloco: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reserva.count({ where }),
  ]);

  return NextResponse.json({ data: reservas, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();
  const body = await req.json().catch(() => ({}));
  const parsed = reservaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { areaComumId, unidadeId, date, startTime, endTime } = parsed.data;

  // Validate área belongs to condomínio
  const area = await prisma.areaComum.findFirst({
    where: { id: areaComumId, condominioId: tenantId, isActive: true },
  });
  if (!area) return NextResponse.json({ error: "Área não encontrada" }, { status: 404 });

  // Validate unidade belongs to condomínio (moradores: must be their own unidade)
  const unidade = await prisma.unidade.findFirst({
    where: { id: unidadeId, bloco: { condominioId: tenantId } },
  });
  if (!unidade) return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });

  // Time validation
  if (startTime >= endTime) {
    return NextResponse.json({ error: "Horário de início deve ser anterior ao horário de término" }, { status: 400 });
  }

  // Conflict check: no overlapping approved/pending reservas on same area + date
  const conflict = await prisma.reserva.findFirst({
    where: {
      areaComumId,
      date: new Date(date),
      status: { in: ["PENDENTE", "APROVADA"] },
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } },
      ],
    },
  });
  if (conflict) {
    return NextResponse.json({ error: "Horário já reservado para esta área" }, { status: 409 });
  }

  const reserva = await prisma.reserva.create({
    data: {
      areaComumId,
      unidadeId,
      userId: session.user.id,
      date: new Date(date),
      startTime,
      endTime,
      status: area.requiresApproval ? "PENDENTE" : "APROVADA",
    },
  });

  return NextResponse.json(reserva, { status: 201 });
}
