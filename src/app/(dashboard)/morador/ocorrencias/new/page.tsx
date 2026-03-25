import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { NovaOcorrenciaForm } from "@/components/ocorrencias/nova-ocorrencia-form";

export default async function NovaOcorrenciaPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();

  // Find morador's unidade
  const morador = await prisma.morador.findFirst({
    where: {
      userId: session.user.id,
      isActive: true,
      unidade: { bloco: { condominioId: tenantId } },
    },
    include: { unidade: { include: { bloco: true } } },
  });

  if (!morador) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Você não está associado a nenhuma unidade. Fale com o síndico.</p>
      </div>
    );
  }

  const unidadeLabel = `${morador.unidade.bloco.name} – Unidade ${morador.unidade.number}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nova Ocorrência</h1>
        <p className="text-sm text-gray-500 mt-1">Registre um problema ou solicitação</p>
      </div>
      <NovaOcorrenciaForm unidadeId={morador.unidade.id} unidadeLabel={unidadeLabel} />
    </div>
  );
}
