import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { Pin } from "lucide-react";
import { PinToggle } from "@/components/comunicados/pin-toggle";

export default async function SindicoComunicadosPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;

  const totalMoradores = await prisma.morador.count({
    where: { isActive: true, unidade: { bloco: { condominioId: tenantId } } },
  });

  const [comunicados, total] = await Promise.all([
    prisma.comunicado.findMany({
      where: { condominioId: tenantId },
      include: { _count: { select: { reads: true } } },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.comunicado.count({ where: { condominioId: tenantId } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comunicados</h1>
        <Button asChild>
          <Link href="/sindico/comunicados/new">
            <span className="mr-2">+</span> Novo Comunicado
          </Link>
        </Button>
      </div>

      {comunicados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nenhum comunicado ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {comunicados.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {c.isPinned && (
                      <Pin className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                    )}
                    <Link
                      href={`/sindico/comunicados/${c.id}`}
                      className="font-medium hover:underline truncate"
                    >
                      {c.title}
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(c.createdAt)} · Lido por{" "}
                    <span className="font-medium">{c._count.reads}</span> de{" "}
                    <span className="font-medium">{totalMoradores}</span> moradores
                  </p>
                </div>
                <PinToggle id={c.id} isPinned={c.isPinned} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" asChild>
              <Link href={`?page=${page - 1}`}>Anterior</Link>
            </Button>
          )}
          <span className="flex items-center text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Button variant="outline" asChild>
              <Link href={`?page=${page + 1}`}>Próxima</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
