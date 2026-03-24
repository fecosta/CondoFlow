import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { visitanteSchema } from "@/lib/validations/visitante";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();
  const { searchParams } = new URL(req.url);
  const today = searchParams.get("today");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 20;

  const isMorador = session.user.role === "MORADOR";

  let where: Record<string, unknown> = {
    unidade: { bloco: { condominioId: tenantId } },
    ...(isMorador ? { userId: session.user.id } : {}),
  };

  if (today === "1") {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    where = {
      ...where,
      OR: [
        // Pontual: expectedDate is today
        {
          type: "PONTUAL",
          expectedDate: { gte: todayDate, lt: tomorrowDate },
        },
        // Recorrente: today is within range
        {
          type: "RECORRENTE",
          startDate: { lte: todayDate },
          endDate: { gte: todayDate },
        },
      ],
    };
  }

  const [visitantes, total] = await Promise.all([
    prisma.visitante.findMany({
      where,
      include: {
        unidade: { include: { bloco: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.visitante.count({ where }),
  ]);

  return NextResponse.json({ data: visitantes, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();
  const body = await req.json().catch(() => ({}));
  const parsed = visitanteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // Validate unidade belongs to condomínio
  const unidade = await prisma.unidade.findFirst({
    where: { id: parsed.data.unidadeId, bloco: { condominioId: tenantId } },
  });
  if (!unidade) return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });

  const visitante = await prisma.visitante.create({
    data: {
      name: parsed.data.name,
      document: parsed.data.document,
      unidadeId: parsed.data.unidadeId,
      userId: session.user.id,
      type: parsed.data.type,
      expectedDate: parsed.data.expectedDate ? new Date(parsed.data.expectedDate) : null,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  });

  return NextResponse.json(visitante, { status: 201 });
}
