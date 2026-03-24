import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { EditUnidadeDialog, DeleteUnidadeButton } from "@/components/unidades/unidade-dialogs";
import { VeiculosPets } from "@/components/unidades/veiculos-pets";

const vincLabel: Record<string, string> = { PROPRIETARIO: "Proprietário", INQUILINO: "Inquilino", DEPENDENTE: "Dependente" };
const petSizeLabel: Record<string, string> = { PEQUENO: "Pequeno", MEDIO: "Médio", GRANDE: "Grande" };

export default async function UnidadeDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();

  const unidade = await prisma.unidade.findFirst({
    where: { id: params.id, bloco: { condominioId: tenantId } },
    include: {
      bloco: true,
      moradores: { where: { isActive: true } },
      encomendas: { orderBy: { receivedAt: "desc" }, take: 5 },
      veiculos: true,
      pets: true,
    },
  });

  if (!unidade) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-gray-500">
          <Link href="/sindico/unidades" className="hover:underline">Unidades</Link>
          {" / "}{unidade.bloco.name} — {unidade.number}
        </p>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-2xl font-bold">
            {unidade.bloco.name} — Unidade {unidade.number}
          </h1>
          <div className="flex gap-2">
            <EditUnidadeDialog
              unidadeId={unidade.id}
              currentNumber={unidade.number}
              currentStatus={unidade.status}
            />
            <DeleteUnidadeButton unidadeId={unidade.id} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Moradores</CardTitle></CardHeader>
        <CardContent>
          {unidade.moradores.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum morador cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {unidade.moradores.map((m) => (
                <div key={m.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    {m.email && <p className="text-xs text-gray-500">{m.email}</p>}
                    {m.phone && <p className="text-xs text-gray-500">{m.phone}</p>}
                  </div>
                  <Badge variant="outline">{vincLabel[m.vinculo]}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <VeiculosPets
        unidadeId={unidade.id}
        veiculos={unidade.veiculos}
        pets={unidade.pets.map((p) => ({ ...p, sizeLabel: petSizeLabel[p.size] }))}
      />

      <Card>
        <CardHeader><CardTitle>Encomendas Recentes</CardTitle></CardHeader>
        <CardContent>
          {unidade.encomendas.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma encomenda.</p>
          ) : (
            <div className="space-y-2">
              {unidade.encomendas.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <span>{e.description ?? "Sem descrição"}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatDateTime(e.receivedAt)}</span>
                    <Badge variant={e.status === "PENDENTE" ? "destructive" : "secondary"}>
                      {e.status === "PENDENTE" ? "Pendente" : "Entregue"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
