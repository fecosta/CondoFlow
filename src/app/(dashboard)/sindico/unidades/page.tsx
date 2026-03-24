import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

const statusLabel: Record<string, string> = {
  OCUPADA: "Ocupada",
  VAGA: "Vaga",
  BLOQUEADA: "Bloqueada",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  OCUPADA: "default",
  VAGA: "secondary",
  BLOQUEADA: "destructive",
};

export default async function SindicoUnidadesPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string; blocoId?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;
  const status = searchParams.status;
  const blocoId = searchParams.blocoId;

  const where: Prisma.UnidadeWhereInput = {
    bloco: { condominioId: tenantId, ...(blocoId ? { id: blocoId } : {}) },
    ...(status ? { status: status as Prisma.EnumUnidadeStatusFilter } : {}),
  };

  const [unidades, total, blocos] = await Promise.all([
    prisma.unidade.findMany({
      where,
      include: {
        bloco: true,
        moradores: { where: { isActive: true } },
      },
      orderBy: [{ bloco: { name: "asc" } }, { number: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.unidade.count({ where }),
    prisma.bloco.findMany({
      where: { condominioId: tenantId },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Unidades</h1>
        <p className="text-sm text-gray-500">{total} unidades</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-sm text-gray-500">Status:</span>
        {["", "OCUPADA", "VAGA", "BLOQUEADA"].map((s) => (
          <Link
            key={s || "all"}
            href={`/sindico/unidades${s ? `?status=${s}` : ""}${blocoId ? `${s ? "&" : "?"}blocoId=${blocoId}` : ""}`}
          >
            <Badge variant={status === s || (!status && !s) ? "default" : "outline"} className="cursor-pointer">
              {s ? statusLabel[s] : "Todas"}
            </Badge>
          </Link>
        ))}
        {blocos.length > 1 && (
          <>
            <span className="text-sm text-gray-500 ml-2">Bloco:</span>
            <Link href={`/sindico/unidades${status ? `?status=${status}` : ""}`}>
              <Badge variant={!blocoId ? "default" : "outline"} className="cursor-pointer">Todos</Badge>
            </Link>
            {blocos.map((b) => (
              <Link key={b.id} href={`/sindico/unidades?blocoId=${b.id}${status ? `&status=${status}` : ""}`}>
                <Badge variant={blocoId === b.id ? "default" : "outline"} className="cursor-pointer">{b.name}</Badge>
              </Link>
            ))}
          </>
        )}
      </div>

      {unidades.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nenhuma unidade encontrada.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {unidades.map((u) => (
            <Link key={u.id} href={`/sindico/unidades/${u.id}`}>
              <Card className="hover:shadow-sm transition-shadow cursor-pointer h-full">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{u.bloco.name} — {u.number}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {u.moradores.length > 0
                          ? u.moradores.map((m) => m.name).join(", ")
                          : "Sem moradores"}
                      </p>
                    </div>
                    <Badge variant={statusVariant[u.status]}>{statusLabel[u.status]}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" asChild>
              <Link href={`?page=${page - 1}${status ? `&status=${status}` : ""}${blocoId ? `&blocoId=${blocoId}` : ""}`}>Anterior</Link>
            </Button>
          )}
          <span className="flex items-center text-sm text-gray-500">Página {page} de {totalPages}</span>
          {page < totalPages && (
            <Button variant="outline" asChild>
              <Link href={`?page=${page + 1}${status ? `&status=${status}` : ""}${blocoId ? `&blocoId=${blocoId}` : ""}`}>Próxima</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
