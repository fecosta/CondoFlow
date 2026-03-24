import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, UserCheck } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { VisitanteEntryButtons } from "@/components/visitantes/entry-buttons";

export default async function PortariaDashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [pendingEncomendas, esperados] = await Promise.all([
    prisma.encomenda.findMany({
      where: { status: "PENDENTE", unidade: { bloco: { condominioId: tenantId } } },
      include: { unidade: { include: { bloco: true } } },
      orderBy: { receivedAt: "asc" },
      take: 20,
    }),
    prisma.visitante.findMany({
      where: {
        unidade: { bloco: { condominioId: tenantId } },
        OR: [
          { type: "PONTUAL", expectedDate: { gte: todayStart, lt: todayEnd } },
          { type: "RECORRENTE", startDate: { lte: todayStart }, endDate: { gte: todayStart } },
        ],
      },
      include: { unidade: { include: { bloco: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Painel da Portaria</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Visitantes Esperados Hoje ({esperados.length})
            </span>
            <Link href="/portaria/visitantes" className="text-sm font-normal text-blue-600 hover:underline">
              Ver todos
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {esperados.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum visitante esperado hoje.</p>
          ) : (
            <div className="space-y-2">
              {esperados.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-100">
                  <div>
                    <p className="font-medium text-sm">{v.name}</p>
                    <p className="text-xs text-gray-500">
                      {v.unidade.bloco.name} — Unidade {v.unidade.number}
                    </p>
                    {v.entryAt && <p className="text-xs text-green-600">Entrou: {formatDateTime(v.entryAt)}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={v.entryAt ? (v.exitAt ? "outline" : "default") : "secondary"}>
                      {v.exitAt ? "Saiu" : v.entryAt ? "Dentro" : "Aguardando"}
                    </Badge>
                    <VisitanteEntryButtons visitanteId={v.id} hasEntry={!!v.entryAt} hasExit={!!v.exitAt} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Encomendas Pendentes ({pendingEncomendas.length})
            </span>
            <Link href="/portaria/encomendas" className="text-sm font-normal text-blue-600 hover:underline">
              Ver todas
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingEncomendas.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Nenhuma encomenda pendente.</p>
          ) : (
            <div className="space-y-3">
              {pendingEncomendas.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-red-50 rounded-md border border-red-100">
                  <div>
                    <p className="font-medium text-sm">
                      {e.unidade.bloco.name} — Unidade {e.unidade.number}
                    </p>
                    {e.description && <p className="text-xs text-gray-500">{e.description}</p>}
                    <p className="text-xs text-gray-400">{formatDateTime(e.receivedAt)}</p>
                  </div>
                  <Badge variant="destructive">Pendente</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
