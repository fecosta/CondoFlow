import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { FinanceiroActions } from "@/components/financeiro/financeiro-actions";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS: Record<string, string> = {
  EM_DIA: "Em Dia",
  PENDENTE: "Pendente",
  INADIMPLENTE: "Inadimplente",
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  EM_DIA: "secondary",
  PENDENTE: "default",
  INADIMPLENTE: "destructive",
};

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: { statusFinanceiro?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const isSindico = ["SINDICO", "SUPER_ADMIN"].includes(session.user.role);
  if (!isSindico) redirect("/sindico/dashboard");

  const tenantId = await getTenantId();

  const where: Record<string, unknown> = {
    bloco: { condominioId: tenantId },
    ...(searchParams.statusFinanceiro ? { statusFinanceiro: searchParams.statusFinanceiro } : {}),
  };

  const [unidades, counts] = await Promise.all([
    prisma.unidade.findMany({
      where,
      include: {
        bloco: { select: { id: true, name: true } },
        moradores: {
          where: { isActive: true },
          select: { id: true, name: true, vinculo: true },
        },
      },
      orderBy: [{ bloco: { name: "asc" } }, { number: "asc" }],
    }),
    prisma.unidade.groupBy({
      by: ["statusFinanceiro"],
      where: { bloco: { condominioId: tenantId } },
      _count: { statusFinanceiro: true },
    }),
  ]);

  const statusCounts = Object.fromEntries(counts.map((c) => [c.statusFinanceiro, c._count.statusFinanceiro]));
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-500 mt-1">Situação financeira das unidades</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "EM_DIA", label: "Em Dia", color: "bg-green-50 border-green-200 text-green-700" },
          { key: "PENDENTE", label: "Pendente", color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
          { key: "INADIMPLENTE", label: "Inadimplente", color: "bg-red-50 border-red-200 text-red-700" },
        ].map(({ key, label, color }) => (
          <div key={key} className={`border rounded-lg p-4 text-center ${color}`}>
            <div className="text-3xl font-bold">{statusCounts[key] ?? 0}</div>
            <div className="text-sm mt-1">{label}</div>
            {total > 0 && (
              <div className="text-xs mt-0.5 opacity-70">
                {Math.round(((statusCounts[key] ?? 0) / total) * 100)}%
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { href: "/sindico/financeiro", label: "Todos", active: !searchParams.statusFinanceiro },
          { href: "/sindico/financeiro?statusFinanceiro=EM_DIA", label: "Em Dia", active: searchParams.statusFinanceiro === "EM_DIA" },
          { href: "/sindico/financeiro?statusFinanceiro=PENDENTE", label: "Pendente", active: searchParams.statusFinanceiro === "PENDENTE" },
          { href: "/sindico/financeiro?statusFinanceiro=INADIMPLENTE", label: "Inadimplente", active: searchParams.statusFinanceiro === "INADIMPLENTE" },
        ].map(({ href, label, active }) => (
          <a key={href} href={href} className={`px-3 py-1 rounded-full text-sm border ${active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            {label}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Unidade</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Moradores</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Situação Atual</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Atualizar</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {unidades.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">Nenhuma unidade encontrada.</td>
                </tr>
              ) : (
                unidades.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {u.bloco.name} – {u.number}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.moradores.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        u.moradores.map((m) => m.name).join(", ")
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_COLORS[u.statusFinanceiro]}>
                        {STATUS_LABELS[u.statusFinanceiro]}
                      </Badge>
                      {u.obsFinanceiro && (
                        <p className="text-xs text-gray-500 mt-1">{u.obsFinanceiro}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <FinanceiroActions
                        unidadeId={u.id}
                        currentStatus={u.statusFinanceiro}
                        currentObs={u.obsFinanceiro}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
