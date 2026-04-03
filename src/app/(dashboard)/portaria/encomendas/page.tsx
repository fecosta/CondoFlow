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
import { SearchInput } from "@/components/ui/search-input";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";

export default async function PortariaEncomendasPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; blocoId?: string; unidadeId?: string; date?: string; q?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;
  const status = searchParams.status;
  const blocoId = searchParams.blocoId;
  const unidadeId = searchParams.unidadeId;
  const date = searchParams.date;
  const q = searchParams.q?.trim();

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { status, blocoId, unidadeId, date, q, ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.delete("page");
    const s = params.toString();
    return `/portaria/encomendas${s ? `?${s}` : ""}`;
  }

  const where: Prisma.EncomendaWhereInput = {
    unidade: { bloco: { condominioId: tenantId, ...(blocoId ? { id: blocoId } : {}) } },
    ...(status ? { status: status as Prisma.EnumEncomendaStatusFilter } : {}),
    ...(unidadeId ? { unidadeId } : {}),
    ...(date ? { receivedAt: { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) } } : {}),
    ...(q
      ? {
          OR: [
            { description: { contains: q } },
            { unidade: { number: { contains: q } } },
            { unidade: { bloco: { name: { contains: q } } } },
            { pickedUpName: { contains: q } },
          ],
        }
      : {}),
  };

  const [encomendas, total, blocos, unidades] = await Promise.all([
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
    prisma.bloco.findMany({ where: { condominioId: tenantId }, orderBy: { name: "asc" } }),
    prisma.unidade.findMany({
      where: { bloco: { condominioId: tenantId, ...(blocoId ? { id: blocoId } : {}) } },
      include: { bloco: true },
      orderBy: [{ bloco: { name: "asc" } }, { number: "asc" }],
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Encomendas</h1>
          <p className="text-sm text-gray-500">{total} encomenda(s)</p>
        </div>
        <NewEncomendaDialog unidades={unidades} />
      </div>

      <Suspense>
        <SearchInput placeholder="Buscar por descrição, unidade..." defaultValue={q} />
      </Suspense>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-sm text-gray-500">Status:</span>
        {(["", "PENDENTE", "ENTREGUE"] as const).map((s) => (
          <Link key={s || "all"} href={buildHref({ status: s || undefined })}>
            <Badge
              variant={
                (!s && !status) || status === s
                  ? s === "PENDENTE"
                    ? "destructive"
                    : "default"
                  : "outline"
              }
              className="cursor-pointer"
            >
              {s === "PENDENTE" ? "Pendentes" : s === "ENTREGUE" ? "Entregues" : "Todas"}
            </Badge>
          </Link>
        ))}

        {blocos.length > 1 && (
          <>
            <span className="text-sm text-gray-500 ml-2">Bloco:</span>
            <Link href={buildHref({ blocoId: undefined, unidadeId: undefined })}>
              <Badge variant={!blocoId ? "default" : "outline"} className="cursor-pointer">Todos</Badge>
            </Link>
            {blocos.map((b) => (
              <Link key={b.id} href={buildHref({ blocoId: b.id, unidadeId: undefined })}>
                <Badge variant={blocoId === b.id ? "default" : "outline"} className="cursor-pointer">{b.name}</Badge>
              </Link>
            ))}
          </>
        )}

        {blocoId && unidades.length > 0 && (
          <>
            <span className="text-sm text-gray-500 ml-2">Unidade:</span>
            <Link href={buildHref({ unidadeId: undefined })}>
              <Badge variant={!unidadeId ? "default" : "outline"} className="cursor-pointer">Todas</Badge>
            </Link>
            {unidades.map((u) => (
              <Link key={u.id} href={buildHref({ unidadeId: u.id })}>
                <Badge variant={unidadeId === u.id ? "default" : "outline"} className="cursor-pointer">{u.number}</Badge>
              </Link>
            ))}
          </>
        )}
      </div>

      {/* Date filter */}
      <form method="GET" action="/portaria/encomendas" className="flex gap-2 items-center">
        {status && <input type="hidden" name="status" value={status} />}
        {blocoId && <input type="hidden" name="blocoId" value={blocoId} />}
        {unidadeId && <input type="hidden" name="unidadeId" value={unidadeId} />}
        {q && <input type="hidden" name="q" value={q} />}
        <label className="text-sm text-gray-500">Data:</label>
        <input
          type="date"
          name="date"
          defaultValue={date ?? ""}
          className="text-xs border rounded px-2 py-1"
        />
        <Button type="submit" variant="outline" size="sm">Filtrar</Button>
        {date && (
          <Link href={buildHref({ date: undefined })}>
            <Button variant="ghost" size="sm">Limpar data</Button>
          </Link>
        )}
      </form>

      {encomendas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nenhuma encomenda encontrada.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {encomendas.map((e) => (
            <Card key={e.id} className={e.status === "PENDENTE" ? "border-red-200" : ""}>
              <CardContent className="pt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">
                    {e.unidade.bloco.name} — Unidade {e.unidade.number}
                  </p>
                  {e.description && (
                    <p className="text-xs text-gray-500 mt-1">{e.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Recebida por {e.receivedBy.name} em {formatDateTime(e.receivedAt)}
                  </p>
                  {e.pickedUpName && (
                    <p className="text-xs text-green-600 mt-1">
                      Retirado por {e.pickedUpName} em {formatDateTime(e.pickedUpAt!)}
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
              <Link href={buildHref({ page: String(page - 1) })}>Anterior</Link>
            </Button>
          )}
          <span className="flex items-center text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Button variant="outline" asChild>
              <Link href={buildHref({ page: String(page + 1) })}>Próxima</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
