import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { BlocoManager } from "@/components/settings/bloco-manager";

export default async function SindicoSettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();

  const condominio = await prisma.condominio.findUnique({
    where: { id: tenantId },
    include: {
      blocos: {
        include: { _count: { select: { unidades: true } } },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!condominio) redirect("/login");

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Condomínio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">Nome</p>
            <p className="font-medium">{condominio.name}</p>
          </div>
          {condominio.cnpj && (
            <div>
              <p className="text-xs text-gray-500">CNPJ</p>
              <p className="font-medium">{condominio.cnpj}</p>
            </div>
          )}
          {condominio.address && (
            <div>
              <p className="text-xs text-gray-500">Endereço</p>
              <p className="font-medium">
                {condominio.address}
                {condominio.city && `, ${condominio.city} - ${condominio.state}`}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500">Criado em</p>
            <p className="font-medium">{formatDate(condominio.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blocos / Torres</CardTitle>
        </CardHeader>
        <CardContent>
          <BlocoManager condominioId={tenantId} blocos={condominio.blocos} />
        </CardContent>
      </Card>
    </div>
  );
}
