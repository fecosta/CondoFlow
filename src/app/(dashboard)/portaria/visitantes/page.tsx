import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { VisitanteEntryButtons } from "@/components/visitantes/entry-buttons";
import { formatDateTime } from "@/lib/utils";

export default async function PortariaVisitantesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const esperados = await prisma.visitante.findMany({
    where: {
      unidade: { bloco: { condominioId: tenantId } },
      OR: [
        { type: "PONTUAL", expectedDate: { gte: todayStart, lt: todayEnd } },
        { type: "RECORRENTE", startDate: { lte: todayStart }, endDate: { gte: todayStart } },
      ],
    },
    include: { unidade: { include: { bloco: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Visitantes</h1>
        <Button variant="outline" asChild>
          <Link href="/portaria/visitantes/historico">Histórico</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Esperados Hoje ({esperados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {esperados.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Nenhum visitante esperado hoje.</p>
          ) : (
            <div className="space-y-3">
              {esperados.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border">
                  <div>
                    <p className="font-medium text-sm">{v.name}</p>
                    {v.document && <p className="text-xs text-gray-500">Doc: {v.document}</p>}
                    <p className="text-xs text-gray-400">
                      {v.unidade.bloco.name} — Unidade {v.unidade.number}
                    </p>
                    {v.entryAt && (
                      <p className="text-xs text-green-600">Entrou: {formatDateTime(v.entryAt)}</p>
                    )}
                    {v.exitAt && (
                      <p className="text-xs text-gray-400">Saiu: {formatDateTime(v.exitAt)}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={v.entryAt ? (v.exitAt ? "outline" : "default") : "secondary"}>
                      {v.exitAt ? "Saiu" : v.entryAt ? "Dentro" : "Aguardando"}
                    </Badge>
                    <VisitanteEntryButtons
                      visitanteId={v.id}
                      hasEntry={!!v.entryAt}
                      hasExit={!!v.exitAt}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
