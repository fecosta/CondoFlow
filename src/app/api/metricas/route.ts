import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const isSindico = ["SINDICO", "SUPER_ADMIN"].includes(session.user.role);
  if (!isSindico) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tenantId = await getTenantId();

  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    unidadesByStatus,
    encomendaByStatus,
    reservaByStatus,
    ocorrenciaByStatus,
    ocorrenciaByCategory,
    comunicados,
    activeUsersLast30,
    activeUsersLast7,
    financeiroCounts,
  ] = await Promise.all([
    // Unidades by status
    prisma.unidade.groupBy({
      by: ["status"],
      where: { bloco: { condominioId: tenantId } },
      _count: { status: true },
    }),
    // Encomendas by status
    prisma.encomenda.groupBy({
      by: ["status"],
      where: { unidade: { bloco: { condominioId: tenantId } } },
      _count: { status: true },
    }),
    // Reservas by status
    prisma.reserva.groupBy({
      by: ["status"],
      where: { areaComum: { condominioId: tenantId } },
      _count: { status: true },
    }),
    // Ocorrências by status
    prisma.ocorrencia.groupBy({
      by: ["status"],
      where: { unidade: { bloco: { condominioId: tenantId } } },
      _count: { status: true },
    }),
    // Ocorrências by category
    prisma.ocorrencia.groupBy({
      by: ["category"],
      where: { unidade: { bloco: { condominioId: tenantId } } },
      _count: { category: true },
    }),
    // Comunicados with read counts
    prisma.comunicado.findMany({
      where: { condominioId: tenantId },
      include: {
        _count: { select: { reads: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // Active users last 30 days
    prisma.condominioUser.count({
      where: {
        condominioId: tenantId,
        user: { lastLoginAt: { gte: last30 } },
      },
    }),
    // Active users last 7 days
    prisma.condominioUser.count({
      where: {
        condominioId: tenantId,
        user: { lastLoginAt: { gte: last7 } },
      },
    }),
    // Financial status counts
    prisma.unidade.groupBy({
      by: ["statusFinanceiro"],
      where: { bloco: { condominioId: tenantId } },
      _count: { statusFinanceiro: true },
    }),
  ]);

  // Total moradores for read rate calculation
  const totalMoradores = await prisma.condominioUser.count({
    where: { condominioId: tenantId, role: "MORADOR" },
  });

  return NextResponse.json({
    unidades: unidadesByStatus.map((u) => ({ status: u.status, count: u._count.status })),
    encomendas: encomendaByStatus.map((e) => ({ status: e.status, count: e._count.status })),
    reservas: reservaByStatus.map((r) => ({ status: r.status, count: r._count.status })),
    ocorrencias: {
      byStatus: ocorrenciaByStatus.map((o) => ({ status: o.status, count: o._count.status })),
      byCategory: ocorrenciaByCategory.map((o) => ({ category: o.category, count: o._count.category })),
    },
    comunicados: comunicados.map((c) => ({
      title: c.title,
      reads: c._count.reads,
      total: totalMoradores,
      createdAt: c.createdAt,
    })),
    financeiro: financeiroCounts.map((f) => ({ status: f.statusFinanceiro, count: f._count.statusFinanceiro })),
    moradores: {
      activeLast7: activeUsersLast7,
      activeLast30: activeUsersLast30,
      total: totalMoradores,
    },
  });
}
