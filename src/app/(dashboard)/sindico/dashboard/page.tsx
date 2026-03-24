import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Package, MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

export default async function SindicoDashboard() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();

  const [totalUnidades, ocupadas, pendingEncomendas, recentComunicados, totalMoradores] =
    await Promise.all([
      prisma.unidade.count({ where: { bloco: { condominioId: tenantId } } }),
      prisma.unidade.count({ where: { bloco: { condominioId: tenantId }, status: "OCUPADA" } }),
      prisma.encomenda.count({ where: { status: "PENDENTE", unidade: { bloco: { condominioId: tenantId } } } }),
      prisma.comunicado.findMany({
        where: { condominioId: tenantId },
        include: { _count: { select: { reads: true } } },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),
      prisma.morador.count({ where: { isActive: true, unidade: { bloco: { condominioId: tenantId } } } }),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Painel</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Unidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalUnidades}</p>
            <p className="text-xs text-gray-500">{ocupadas} ocupadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="h-4 w-4" /> Moradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalMoradores}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Package className="h-4 w-4" /> Encomendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingEncomendas}</p>
            <p className="text-xs text-gray-500">pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Comunicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{recentComunicados.length}</p>
            <p className="text-xs text-gray-500">recentes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Comunicados Recentes</span>
            <Link href="/sindico/comunicados" className="text-sm font-normal text-blue-600 hover:underline">
              Ver todos
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentComunicados.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum comunicado ainda.</p>
          ) : (
            <div className="space-y-3">
              {recentComunicados.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/sindico/comunicados/${c.id}`} className="text-sm font-medium hover:underline">
                      {c.isPinned && <span className="text-yellow-500 mr-1">📌</span>}
                      {c.title}
                    </Link>
                    <p className="text-xs text-gray-500">{formatDateTime(c.createdAt)}</p>
                  </div>
                  <Badge variant="secondary">{c._count.reads} leituras</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
