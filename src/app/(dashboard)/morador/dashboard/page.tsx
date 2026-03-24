import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Package } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function MoradorDashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();

  // Find morador's unidade
  const morador = await prisma.morador.findFirst({
    where: { userId: session.user.id },
    select: { unidadeId: true },
  });

  const unidadeId = morador?.unidadeId;

  const [unreadComunicados, pendingEncomendas] = await Promise.all([
    prisma.comunicado.findMany({
      where: {
        condominioId: tenantId,
        reads: { none: { userId: session.user.id } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    unidadeId
      ? prisma.encomenda.findMany({
          where: { unidadeId, status: "PENDENTE" },
          include: { unidade: { include: { bloco: true } } },
          orderBy: { receivedAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Painel</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Não Lidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{unreadComunicados.length}</p>
            <p className="text-xs text-gray-500">comunicados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Package className="h-4 w-4" /> Encomendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingEncomendas.length}</p>
            <p className="text-xs text-gray-500">na portaria</p>
          </CardContent>
        </Card>
      </div>

      {unreadComunicados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Comunicados não lidos</span>
              <Link href="/morador/comunicados" className="text-sm font-normal text-blue-600 hover:underline">
                Ver todos
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unreadComunicados.map((c) => (
                <Link
                  key={c.id}
                  href={`/morador/comunicados/${c.id}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                >
                  <span className="text-sm font-medium">
                    {c.isPinned && <span className="text-yellow-500 mr-1">📌</span>}
                    {c.title}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingEncomendas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Encomendas aguardando retirada</span>
              <Link href="/morador/encomendas" className="text-sm font-normal text-blue-600 hover:underline">
                Ver todas
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingEncomendas.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-100">
                  <div>
                    <p className="text-sm font-medium">Unidade {e.unidade.number}</p>
                    {e.description && <p className="text-xs text-gray-500">{e.description}</p>}
                  </div>
                  <Badge variant="destructive">Pendente</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
