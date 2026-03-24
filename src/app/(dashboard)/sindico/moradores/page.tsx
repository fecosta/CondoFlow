import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search } from "@/components/moradores/search";
import { NewMoradorDialog } from "@/components/moradores/new-morador-dialog";

const vincLabel: Record<string, string> = { PROPRIETARIO: "Proprietário", INQUILINO: "Inquilino", DEPENDENTE: "Dependente" };

export default async function SindicoMoradoresPage({
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
    isActive: true,
    unidade: { bloco: { condominioId: tenantId } },
    ...(search ? { name: { contains: search } } : {}),
  };

  const [moradores, total, unidades] = await Promise.all([
    prisma.morador.findMany({
      where,
      include: { unidade: { include: { bloco: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.morador.count({ where }),
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
        <h1 className="text-2xl font-bold">Moradores</h1>
        <div className="flex gap-2">
          <Link href="/sindico/moradores/import">
            <Button variant="outline" size="sm">Importar CSV</Button>
          </Link>
          <NewMoradorDialog unidades={unidades} />
        </div>
      </div>

      <Search placeholder="Buscar por nome..." defaultValue={search} />

      {moradores.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            {search ? `Nenhum morador encontrado para "${search}".` : "Nenhum morador cadastrado."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {moradores.map((m) => (
            <Card key={m.id}>
              <CardContent className="pt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{m.name}</p>
                  <p className="text-xs text-gray-500">
                    {m.unidade.bloco.name} — Unidade {m.unidade.number}
                  </p>
                  {m.email && <p className="text-xs text-gray-400">{m.email}</p>}
                </div>
                <Badge variant="outline">{vincLabel[m.vinculo]}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" asChild>
              <Link href={`?page=${page - 1}${search ? `&search=${search}` : ""}`}>Anterior</Link>
            </Button>
          )}
          <span className="flex items-center text-sm text-gray-500">Página {page} de {totalPages}</span>
          {page < totalPages && (
            <Button variant="outline" asChild>
              <Link href={`?page=${page + 1}${search ? `&search=${search}` : ""}`}>Próxima</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
