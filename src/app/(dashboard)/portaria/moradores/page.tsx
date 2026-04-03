import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { SearchInput } from "@/components/ui/search-input";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";

const vinculoLabel: Record<string, string> = {
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
  const q = searchParams.q?.trim();
  const blocoId = searchParams.blocoId;

  const where: Prisma.MoradorWhereInput = {
    isActive: true,
    unidade: { bloco: { condominioId: tenantId, ...(blocoId ? { id: blocoId } : {}) } },
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
            { unidade: { number: { contains: q } } },
            { unidade: { bloco: { name: { contains: q } } } },
          ],
        }
      : {}),
  };

  const [moradores, blocos] = await Promise.all([
    prisma.morador.findMany({
      where,
      include: { unidade: { include: { bloco: true } } },
      orderBy: [{ unidade: { bloco: { name: "asc" } } }, { unidade: { number: "asc" } }, { name: "asc" }],
      take: 100,
    }),
    prisma.bloco.findMany({ where: { condominioId: tenantId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Moradores</h1>
        <p className="text-sm text-gray-500">{moradores.length} morador(es)</p>
      </div>

      <Suspense>
        <SearchInput placeholder="Buscar por nome, e-mail, telefone, unidade..." defaultValue={q} />
      </Suspense>

      {/* Bloco filter */}
      {blocos.length > 1 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm text-gray-500">Bloco:</span>
          <Link href={q ? `?q=${q}` : "/portaria/moradores"}>
            <Badge variant={!blocoId ? "default" : "outline"} className="cursor-pointer">Todos</Badge>
          </Link>
          {blocos.map((b) => (
            <Link key={b.id} href={`?blocoId=${b.id}${q ? `&q=${q}` : ""}`}>
              <Badge variant={blocoId === b.id ? "default" : "outline"} className="cursor-pointer">{b.name}</Badge>
            </Link>
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
                  <p className="font-medium text-sm">{m.name}</p>
                  <p className="text-xs text-gray-500">
                    {m.unidade.bloco.name} — Unidade {m.unidade.number}
                  </p>
                  {(m.email || m.phone) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[m.phone, m.email].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <Badge variant="outline">{vinculoLabel[m.vinculo]}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
