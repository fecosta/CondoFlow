import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  ABERTA: "Aberta",
  EM_ANDAMENTO: "Em Andamento",
  RESOLVIDA: "Resolvida",
  FECHADA: "Fechada",
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ABERTA: "destructive",
  EM_ANDAMENTO: "default",
  RESOLVIDA: "secondary",
  FECHADA: "outline",
};

const CATEGORY_LABELS: Record<string, string> = {
  MANUTENCAO: "Manutenção",
  BARULHO: "Barulho",
  SEGURANCA: "Segurança",
  LIMPEZA: "Limpeza",
  AREAS_COMUNS: "Áreas Comuns",
  OUTROS: "Outros",
};

export default async function MoradorOcorrenciasPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();

  const ocorrencias = await prisma.ocorrencia.findMany({
    where: {
      userId: session.user.id,
      unidade: { bloco: { condominioId: tenantId } },
    },
    include: {
      unidade: { include: { bloco: true } },
      _count: { select: { comentarios: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ocorrências</h1>
          <p className="text-sm text-gray-500 mt-1">Seus chamados e solicitações</p>
        </div>
        <Button asChild>
          <Link href="/morador/ocorrencias/new">
            <Plus className="h-4 w-4 mr-2" />
            Nova Ocorrência
          </Link>
        </Button>
      </div>

      {ocorrencias.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">Nenhuma ocorrência registrada</p>
          <p className="text-sm mt-1">Clique em &quot;Nova Ocorrência&quot; para registrar um problema</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ocorrencias.map((o) => (
            <Link
              key={o.id}
              href={`/morador/ocorrencias/${o.id}`}
              className="block bg-white border rounded-lg p-4 hover:border-gray-400 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{o.title}</span>
                    <Badge variant={STATUS_COLORS[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{o.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{CATEGORY_LABELS[o.category]}</span>
                    <span>·</span>
                    <span>{o.unidade.bloco.name} – Unidade {o.unidade.number}</span>
                    <span>·</span>
                    <span>{formatDateTime(o.createdAt)}</span>
                    {o._count.comentarios > 0 && (
                      <>
                        <span>·</span>
                        <span>{o._count.comentarios} comentário{o._count.comentarios !== 1 ? "s" : ""}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
