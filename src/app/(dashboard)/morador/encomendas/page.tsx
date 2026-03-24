import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export default async function MoradorEncomendasPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // getTenantId is called to ensure the user is properly scoped,
  // but morador queries are filtered by their own unidade.
  await getTenantId();

  const morador = await prisma.morador.findFirst({
    where: { userId: session.user.id },
    select: { unidadeId: true },
  });

  const encomendas = morador
    ? await prisma.encomenda.findMany({
        where: { unidadeId: morador.unidadeId },
        include: { unidade: { include: { bloco: true } } },
        orderBy: { receivedAt: "desc" },
        take: 50,
      })
    : [];

  const pendentes = encomendas.filter((e) => e.status === "PENDENTE");
  const entregues = encomendas.filter((e) => e.status === "ENTREGUE");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Minhas Encomendas</h1>

      {pendentes.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-red-600">
            Aguardando retirada ({pendentes.length})
          </h2>
          {pendentes.map((e) => (
            <Card key={e.id} className="border-red-200">
              <CardContent className="pt-4 flex items-start justify-between gap-3">
                <div>
                  {e.description && (
                    <p className="text-sm font-medium">{e.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Recebida em {formatDateTime(e.receivedAt)}
                  </p>
                </div>
                <Badge variant="destructive">Pendente</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {entregues.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-gray-600">
            Histórico ({entregues.length})
          </h2>
          {entregues.map((e) => (
            <Card key={e.id}>
              <CardContent className="pt-4 flex items-start justify-between gap-3">
                <div>
                  {e.description && (
                    <p className="text-sm font-medium">{e.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Recebida em {formatDateTime(e.receivedAt)}
                  </p>
                  {e.pickedUpName && (
                    <p className="text-xs text-green-600">
                      Retirado por {e.pickedUpName} em{" "}
                      {formatDateTime(e.pickedUpAt!)}
                    </p>
                  )}
                </div>
                <Badge variant="secondary">Entregue</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {encomendas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nenhuma encomenda encontrada.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
