import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CondominioForm } from "@/components/forms/condominio-form";

export default async function CondominioDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const condominio = await prisma.condominio.findUnique({
    where: { id: params.id },
    include: {
      blocos: { include: { _count: { select: { unidades: true } } } },
      _count: { select: { condominioUsers: true } },
    },
  });

  if (!condominio) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-gray-500">
          <Link href="/admin/condominios" className="hover:underline">Condomínios</Link>
          {" / "}{condominio.name}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-2xl font-bold">{condominio.name}</h1>
          <Badge variant={condominio.isActive ? "default" : "secondary"}>
            {condominio.isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Blocos</CardTitle></CardHeader>
        <CardContent>
          {condominio.blocos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum bloco cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {condominio.blocos.map((b) => (
                <div key={b.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{b.name}</span>
                  <span className="text-xs text-gray-500">{b._count.unidades} unidades</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CondominioForm
        condominioId={condominio.id}
        defaultValues={{
          name: condominio.name,
          cnpj: condominio.cnpj ?? undefined,
          address: condominio.address ?? undefined,
          city: condominio.city ?? undefined,
          state: condominio.state ?? undefined,
          zipCode: condominio.zipCode ?? undefined,
        }}
      />
    </div>
  );
}
