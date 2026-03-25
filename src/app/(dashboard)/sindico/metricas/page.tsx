import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { MetricasCharts } from "@/components/metricas/metricas-charts";

export default async function MetricasPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isSindico = ["SINDICO", "SUPER_ADMIN"].includes(session.user.role);
  if (!isSindico) redirect("/sindico/dashboard");

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
    totalMoradores,
  ] = await Promise.all([
    prisma.unidade.groupBy({ by: ["status"], where: { bloco: { condominioId: tenantId } }, _count: { status: true } }),
    prisma.encomenda.groupBy({ by: ["status"], where: { unidade: { bloco: { condominioId: tenantId } } }, _count: { status: true } }),
    prisma.reserva.groupBy({ by: ["status"], where: { areaComum: { condominioId: tenantId } }, _count: { status: true } }),
    prisma.ocorrencia.groupBy({ by: ["status"], where: { unidade: { bloco: { condominioId: tenantId } } }, _count: { status: true } }),
    prisma.ocorrencia.groupBy({ by: ["category"], where: { unidade: { bloco: { condominioId: tenantId } } }, _count: { category: true } }),
    prisma.comunicado.findMany({
      where: { condominioId: tenantId },
      include: { _count: { select: { reads: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.condominioUser.count({ where: { condominioId: tenantId, user: { lastLoginAt: { gte: last30 } } } }),
    prisma.condominioUser.count({ where: { condominioId: tenantId, user: { lastLoginAt: { gte: last7 } } } }),
    prisma.unidade.groupBy({ by: ["statusFinanceiro"], where: { bloco: { condominioId: tenantId } }, _count: { statusFinanceiro: true } }),
    prisma.condominioUser.count({ where: { condominioId: tenantId, role: "MORADOR" } }),
  ]);

  const data = {
    unidades: unidadesByStatus.map((u) => ({ status: u.status, count: u._count.status })),
    encomendas: encomendaByStatus.map((e) => ({ status: e.status, count: e._count.status })),
    reservas: reservaByStatus.map((r) => ({ status: r.status, count: r._count.status })),
    ocorrencias: {
      byStatus: ocorrenciaByStatus.map((o) => ({ status: o.status, count: o._count.status })),
      byCategory: ocorrenciaByCategory.map((o) => ({ category: o.category, count: o._count.category })),
    },
    financeiro: financeiroCounts.map((f) => ({ status: f.statusFinanceiro, count: f._count.statusFinanceiro })),
    comunicados: comunicados.map((c) => ({
      title: c.title,
      reads: c._count.reads,
      total: totalMoradores,
      createdAt: c.createdAt.toISOString(),
    })),
    moradores: {
      activeLast7: activeUsersLast7,
      activeLast30: activeUsersLast30,
      total: totalMoradores,
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Métricas</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral de uso e atividade do condomínio</p>
      </div>
      <MetricasCharts data={data} />
    </div>
  );
}
