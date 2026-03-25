import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import type { Prisma } from "@prisma/client";

const VINCULO_LABELS: Record<string, string> = {
  PROPRIETARIO: "Proprietário",
  INQUILINO: "Inquilino",
  DEPENDENTE: "Dependente",
};

export default async function PortariaMoradoresPage({
  searchParams,
}: {
  searchParams: { q?: string; blocoId?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();
  const { q, blocoId } = searchParams;

  const where: Prisma.MoradorWhereInput = {
    isActive: true,
    unidade: { bloco: { condominioId: tenantId, ...(blocoId ? { id: blocoId } : {}) } },
    ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }, { unidade: { number: { contains: q } } }] } : {}),
  };

  const [moradores, blocos] = await Promise.all([
    prisma.morador.findMany({
      where,
      include: {
        unidade: { include: { bloco: true } },
      },
      orderBy: [{ unidade: { bloco: { name: "asc" } } }, { name: "asc" }],
      take: 100,
    }),
    prisma.bloco.findMany({ where: { condominioId: tenantId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Moradores</h1>
        <p className="text-sm text-gray-500">{moradores.length} morador(es) encontrado(s)</p>
      </div>

      {/* Search */}
      <SearchInput placeholder="Buscar por nome, e-mail, telefone ou unidade..." defaultValue={q} />

      {/* Bloco filter */}
      {blocos.length > 1 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm text-gray-500">Bloco:</span>
          <a href="/portaria/moradores" className={`px-3 py-1 rounded-full text-sm border ${!blocoId ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 hover:bg-gray-50"}`}>Todos</a>
          {blocos.map((b) => (
            <a key={b.id} href={`/portaria/moradores?blocoId=${b.id}${q ? `&q=${q}` : ""}`} className={`px-3 py-1 rounded-full text-sm border ${blocoId === b.id ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              {b.name}
            </a>
          ))}
        </div>
      )}

      {moradores.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nenhum morador encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {moradores.map((m) => (
            <Card key={m.id}>
              <CardContent className="pt-4 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{m.name}</p>
                    <Badge variant="outline" className="text-xs">{VINCULO_LABELS[m.vinculo]}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {m.unidade.bloco.name} — Unidade {m.unidade.number}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {m.email && <p className="text-xs text-gray-400">{m.email}</p>}
                    {m.phone && <p className="text-xs text-gray-400">{m.phone}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
