import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function MoradorVisitantesPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;

  const where = {
    userId: session.user.id,
    unidade: { bloco: { condominioId: tenantId } },
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
        <h1 className="text-2xl font-bold">Meus Visitantes</h1>
        <Button asChild>
          <Link href="/morador/visitantes/new">
            <Plus className="h-4 w-4 mr-2" /> Pré-cadastrar
          </Link>
        </Button>
      </div>

      {visitantes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nenhum visitante pré-cadastrado.
          </CardContent>
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
                    {v.type === "PONTUAL"
                      ? v.expectedDate ? `Esperado em ${formatDate(v.expectedDate)}` : "Pontual"
                      : v.startDate && v.endDate
                      ? `${formatDate(v.startDate)} a ${formatDate(v.endDate)}`
                      : "Recorrente"}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <Badge variant="outline">{v.type === "PONTUAL" ? "Pontual" : "Recorrente"}</Badge>
                  {v.entryAt && (
                    <p className="text-xs text-green-600">Entrada: {formatDate(v.entryAt)}</p>
                  )}
                  {v.exitAt && (
                    <p className="text-xs text-gray-400">Saída: {formatDate(v.exitAt)}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && <Button variant="outline" asChild><Link href={`?page=${page - 1}`}>Anterior</Link></Button>}
          <span className="flex items-center text-sm text-gray-500">Página {page} de {totalPages}</span>
          {page < totalPages && <Button variant="outline" asChild><Link href={`?page=${page + 1}`}>Próxima</Link></Button>}
        </div>
      )}
    </div>
  );
}
