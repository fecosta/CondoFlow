import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReservaActions } from "@/components/reservas/reserva-actions";
import { SearchInput } from "@/components/ui/search-input";
import { formatDate } from "@/lib/utils";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";

const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
  CANCELADA: "Cancelada",
};
const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDENTE: "secondary",
  APROVADA: "default",
  REJEITADA: "destructive",
  CANCELADA: "outline",
};

export default async function SindicoReservasPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; blocoId?: string; unidadeId?: string; q?: string };
}) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) redirect("/login");

  const tenantId = await getTenantId();
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;
  const status = searchParams.status;
  const blocoId = searchParams.blocoId;
  const unidadeId = searchParams.unidadeId;
  const q = searchParams.q?.trim();

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { status, blocoId, unidadeId, q, ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.delete("page");
    const s = params.toString();
    return `/sindico/reservas${s ? `?${s}` : ""}`;
  }

  const where: Prisma.ReservaWhereInput = {
    areaComum: { condominioId: tenantId },
    ...(status ? { status: status as Prisma.EnumReservaStatusFilter } : {}),
    ...(unidadeId ? { unidadeId } : {}),
    ...(blocoId && !unidadeId ? { unidade: { blocoId } } : {}),
    ...(q
      ? {
          OR: [
            { areaComum: { name: { contains: q } } },
            { unidade: { number: { contains: q } } },
            { unidade: { bloco: { name: { contains: q } } } },
            { user: { name: { contains: q } } },
          ],
        }
      : {}),
  };

  const [reservas, total, blocos, unidades] = await Promise.all([
    prisma.reserva.findMany({
      where,
      include: {
        areaComum: { select: { name: true } },
        unidade: { include: { bloco: true } },
        user: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reserva.count({ where }),
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
      <div>
        <h1 className="text-2xl font-bold">Reservas</h1>
        <p className="text-sm text-gray-500">{total} reserva(s)</p>
      </div>

      <Suspense>
        <SearchInput placeholder="Buscar por área, unidade, morador..." defaultValue={q} />
      </Suspense>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-sm text-gray-500">Status:</span>
        {["", "PENDENTE", "APROVADA", "REJEITADA", "CANCELADA"].map((s) => (
          <Link key={s || "all"} href={buildHref({ status: s || undefined })}>
            <Badge
              variant={status === s || (!status && !s) ? "default" : "outline"}
              className="cursor-pointer"
            >
              {s ? statusLabel[s] : "Todas"}
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

      {reservas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">Nenhuma reserva encontrada.</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reservas.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{r.areaComum.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(r.date)} · {r.startTime}–{r.endTime}
                    </p>
                    <p className="text-xs text-gray-400">
                      {r.unidade.bloco.name} — Unidade {r.unidade.number} · {r.user.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[r.status]}>{statusLabel[r.status]}</Badge>
                    {r.status === "PENDENTE" && <ReservaActions reservaId={r.id} />}
                    {r.status === "APROVADA" && <ReservaActions reservaId={r.id} cancelOnly />}
                  </div>
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
          <span className="flex items-center text-sm text-gray-500">Página {page} de {totalPages}</span>
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
