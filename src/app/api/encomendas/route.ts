import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encomendaSchema } from "@/lib/validations/encomenda";
import { getTenantId } from "@/lib/tenant";
import { sendEmailAsync } from "@/lib/email";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));
  const status = searchParams.get("status");
  const unidadeId = searchParams.get("unidadeId");

  let where: Prisma.EncomendaWhereInput = {
    unidade: { bloco: { condominioId: tenantId } },
    ...(status ? { status: status as Prisma.EnumEncomendaStatusFilter } : {}),
    ...(unidadeId ? { unidadeId } : {}),
  };

  // Moradores see only their own
  if (session.user.role === "MORADOR") {
    const morador = await prisma.morador.findFirst({
      where: { userId: session.user.id },
      select: { unidadeId: true },
    });
    if (morador) {
      where = { unidadeId: morador.unidadeId, ...(status ? { status: status as Prisma.EnumEncomendaStatusFilter } : {}) };
    } else {
      return NextResponse.json({ data: [], total: 0, page, limit });
    }
  }

  const [encomendas, total] = await Promise.all([
    prisma.encomenda.findMany({
      where,
      include: {
        unidade: { include: { bloco: true } },
        receivedBy: { select: { name: true } },
      },
      orderBy: { receivedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.encomenda.count({ where }),
  ]);

  return NextResponse.json({ data: encomendas, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!["SUPER_ADMIN", "SINDICO", "PORTEIRO"].includes(session.user.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tenantId = await getTenantId();
  const body = await req.json().catch(() => ({}));
  const parsed = encomendaSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });

  const unidade = await prisma.unidade.findFirst({
    where: { id: parsed.data.unidadeId, bloco: { condominioId: tenantId } },
    include: { moradores: { where: { isActive: true, email: { not: null } }, select: { email: true, name: true } } },
  });
  if (!unidade) return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });

  const encomenda = await prisma.encomenda.create({
    data: { ...parsed.data, receivedById: session.user.id },
    include: { unidade: { include: { bloco: true } } },
  });

  // Audit log for AI-scanned packages
  if (parsed.data.wasScanned) {
    prisma.auditLog
      .create({
        data: {
          action: "ENCOMENDA_CREATED_VIA_SCAN",
          entity: "Encomenda",
          entityId: encomenda.id,
          userId: session.user.id,
          details: JSON.stringify({
            wasScanned: true,
            scanConfidence: parsed.data.scanConfidence ?? null,
          }),
        },
      })
      .catch(() => {});
  }

  // Email notification
  const emails = unidade.moradores.map((m) => m.email!).filter(Boolean);
  if (emails.length > 0) {
    sendEmailAsync({
      to: emails,
      subject: "Nova encomenda na portaria — CondoFlow",
      html: `
        <p>Olá!</p>
        <p>Uma nova encomenda foi registrada para a unidade <strong>${unidade.number}</strong>.</p>
        ${parsed.data.description ? `<p>Destinatário: ${parsed.data.description}</p>` : ""}
        ${parsed.data.remetente ? `<p>Remetente: ${parsed.data.remetente}</p>` : ""}
        ${parsed.data.codigoRastreio ? `<p>Código de Rastreio: ${parsed.data.codigoRastreio}</p>` : ""}
        <p>Dirija-se à portaria para retirar.</p>
      `,
    });
  }

  return NextResponse.json(encomenda, { status: 201 });
}
