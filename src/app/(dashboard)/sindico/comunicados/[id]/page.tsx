import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { ComunicadoForm } from "@/components/forms/comunicado-form";
import { DeleteComunicado } from "@/components/comunicados/delete-comunicado";

export default async function ComunicadoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();

  const totalMoradores = await prisma.morador.count({
    where: { isActive: true, unidade: { bloco: { condominioId: tenantId } } },
  });

  const comunicado = await prisma.comunicado.findFirst({
    where: { id: params.id, condominioId: tenantId },
    include: { _count: { select: { reads: true } } },
  });

  if (!comunicado) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">
            <Link href="/sindico/comunicados" className="hover:underline">
              Comunicados
            </Link>
            {" / "}Editar
          </p>
          <h1 className="text-2xl font-bold">{comunicado.title}</h1>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
            <span>Publicado em {formatDateTime(comunicado.createdAt)}</span>
            <Badge variant="secondary">
              Lido por {comunicado._count.reads} de {totalMoradores} moradores
            </Badge>
            {comunicado.isPinned && (
              <Badge className="bg-yellow-100 text-yellow-800">Fixado</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <ComunicadoForm
        comunicadoId={comunicado.id}
        defaultValues={{
          title: comunicado.title,
          content: comunicado.content,
          isPinned: comunicado.isPinned,
        }}
      />

      <DeleteComunicado id={comunicado.id} />
    </div>
  );
}
