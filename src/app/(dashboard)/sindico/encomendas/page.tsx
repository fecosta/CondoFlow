import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { NewEncomendaDialog } from "@/components/encomendas/new-encomenda-dialog";
import { RetirarButton } from "@/components/encomendas/retirar-button";
import type { Prisma } from "@prisma/client";

export default async function SindicoEncomendasPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; unidadeId?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;
  const status = searchParams.status;
  const unidadeId = searchParams.unidadeId;

  const where: Prisma.EncomendaWhereInput = {
    unidade: { bloco: { condominioId: tenantId } },
    ...(status ? { status: status as Prisma.EnumEncomendaStatusFilter } : {}),
    ...(unidadeId ? { unidadeId } : {}),
  };

  const [encomendas, total, unidades] = await Promise.all([
    prisma.encomenda.findMany({
      where,
      include: {
        unidade: { include: { bloco: true } },
        receivedBy: { select: { name: true } },
      },
      orderBy: { receivedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.encomenda.count({ where }),
    prisma.unidade.findMany({
      where: { bloco: { condominioId: tenantId } },
      include: { bloco: true },
      orderBy: [{ bloco: { name: "asc" } }, { number: "asc" }],
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Encomendas</h1>
        <NewEncomendaDialog unidades={unidades} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/sindico/encomendas">
          <Badge
            variant={!status ? "default" : "outline"}
            className="cursor-pointer"
          >
            Todas
          </Badge>
        </Link>
        <Link href="/sindico/encomendas?status=PENDENTE">
          <Badge
            variant={status === "PENDENTE" ? "destructive" : "outline"}
            className="cursor-pointer"
          >
            Pendentes
          </Badge>
        </Link>
        <Link href="/sindico/encomendas?status=ENTREGUE">
          <Badge
            variant={status === "ENTREGUE" ? "secondary" : "outline"}
            className="cursor-pointer"
          >
            Entregues
          </Badge>
        </Link>
      </div>

      {encomendas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nenhuma encomenda encontrada.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {encomendas.map((e) => (
            <Card
              key={e.id}
              className={e.status === "PENDENTE" ? "border-red-200" : ""}
            >
              <CardContent className="pt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">
                    {e.unidade.bloco.name} — Unidade {e.unidade.number}
                  </p>
                  {e.description && (
                    <p className="text-xs text-gray-500 mt-1">{e.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Recebida por {e.receivedBy.name} em{" "}
                    {formatDateTime(e.receivedAt)}
                  </p>
                  {e.pickedUpName && (
                    <p className="text-xs text-green-600 mt-1">
                      Retirado por {e.pickedUpName} em{" "}
                      {formatDateTime(e.pickedUpAt!)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {e.status === "PENDENTE" ? (
                    <>
                      <Badge variant="destructive">Pendente</Badge>
                      <RetirarButton encomendaId={e.id} />
                    </>
                  ) : (
                    <Badge variant="secondary">Entregue</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" asChild>
              <Link
                href={`?page=${page - 1}${status ? `&status=${status}` : ""}`}
              >
                Anterior
              </Link>
            </Button>
          )}
          <span className="flex items-center text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Button variant="outline" asChild>
              <Link
                href={`?page=${page + 1}${status ? `&status=${status}` : ""}`}
              >
                Próxima
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
