import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

export default async function PortariaDashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();

  const pendingEncomendas = await prisma.encomenda.findMany({
    where: {
      status: "PENDENTE",
      unidade: { bloco: { condominioId: tenantId } },
    },
    include: { unidade: { include: { bloco: true } } },
    orderBy: { receivedAt: "asc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Painel da Portaria</h1>

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
