import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function VisitantesHistoricoPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;
  const search = searchParams.search ?? "";

  const where = {
    unidade: { bloco: { condominioId: tenantId } },
    ...(search ? {
      OR: [
        { name: { contains: search } },
        { document: { contains: search } },
      ],
    } : {}),
  };

  const [visitantes, total] = await Promise.all([
    prisma.visitante.findMany({
      where,
      include: { unidade: { include: { bloco: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.visitante.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Histórico de Visitas</h1>
        <Button variant="outline" asChild>
          <Link href="/portaria/visitantes">Esperados Hoje</Link>
        </Button>
      </div>

      {visitantes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">Nenhuma visita registrada.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {visitantes.map((v) => (
            <Card key={v.id}>
              <CardContent className="pt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{v.name}</p>
                  {v.document && <p className="text-xs text-gray-500">Doc: {v.document}</p>}
                  <p className="text-xs text-gray-400">
                    {v.unidade.bloco.name} — Unidade {v.unidade.number}
                  </p>
                  {v.entryAt && <p className="text-xs text-green-600">Entrada: {formatDateTime(v.entryAt)}</p>}
                  {v.exitAt && <p className="text-xs text-gray-400">Saída: {formatDateTime(v.exitAt)}</p>}
                </div>
                <div className="text-right space-y-1">
                  <Badge variant="outline">{v.type === "PONTUAL" ? "Pontual" : "Recorrente"}</Badge>
                  <p className="text-xs text-gray-400">
                    {v.type === "PONTUAL" && v.expectedDate ? formatDate(v.expectedDate) : ""}
                    {v.type === "RECORRENTE" && v.startDate && v.endDate
                      ? `${formatDate(v.startDate)} – ${formatDate(v.endDate)}`
                      : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <Button variant="outline" asChild><Link href={`?page=${page - 1}${search ? `&search=${search}` : ""}`}>Anterior</Link></Button>}
          <span className="flex items-center text-sm text-gray-500">Página {page} de {totalPages}</span>
          {page < totalPages && <Button variant="outline" asChild><Link href={`?page=${page + 1}${search ? `&search=${search}` : ""}`}>Próxima</Link></Button>}
        </div>
      )}
    </div>
  );
}
