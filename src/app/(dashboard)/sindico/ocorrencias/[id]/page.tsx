import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { Badge } from "@/components/ui/badge";
import { OcorrenciaActions } from "@/components/ocorrencias/ocorrencia-actions";
import { ComentarioForm } from "@/components/ocorrencias/comentario-form";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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

const PRIORITY_LABELS: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

const CATEGORY_LABELS: Record<string, string> = {
  MANUTENCAO: "Manutenção",
  BARULHO: "Barulho",
  SEGURANCA: "Segurança",
  LIMPEZA: "Limpeza",
  AREAS_COMUNS: "Áreas Comuns",
  OUTROS: "Outros",
};

export default async function SindicoOcorrenciaDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();

  const ocorrencia = await prisma.ocorrencia.findFirst({
    where: { id: params.id, unidade: { bloco: { condominioId: tenantId } } },
    include: {
      unidade: { include: { bloco: true } },
      user: { select: { id: true, name: true, email: true } },
      comentarios: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      imagens: true,
    },
  });

  if (!ocorrencia) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/sindico/ocorrencias" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar às Ocorrências
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{ocorrencia.title}</h1>
          <Badge variant={STATUS_COLORS[ocorrencia.status]}>{STATUS_LABELS[ocorrencia.status]}</Badge>
        </div>
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
          <span>{CATEGORY_LABELS[ocorrencia.category]}</span>
          <span>·</span>
          <span>Prioridade: {PRIORITY_LABELS[ocorrencia.priority]}</span>
          <span>·</span>
          <span>{ocorrencia.unidade.bloco.name} – Unidade {ocorrencia.unidade.number}</span>
          <span>·</span>
          <span>Aberta por {ocorrencia.user.name} em {formatDateTime(ocorrencia.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-medium text-gray-900 mb-3">Ações</h2>
        <OcorrenciaActions ocorrenciaId={ocorrencia.id} currentStatus={ocorrencia.status} />
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-medium text-gray-900 mb-2">Descrição</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{ocorrencia.description}</p>
      </div>

      {ocorrencia.resolution && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="font-medium text-green-800 mb-2">Resolução</h2>
          <p className="text-green-700 whitespace-pre-wrap">{ocorrencia.resolution}</p>
        </div>
      )}

      {ocorrencia.imagens.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-medium text-gray-900 mb-3">Imagens</h2>
          <div className="flex flex-wrap gap-3">
            {ocorrencia.imagens.map((img) => (
              <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                Ver imagem
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="bg-white border rounded-lg p-4 space-y-4">
        <h2 className="font-medium text-gray-900">Comentários</h2>
        {ocorrencia.comentarios.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum comentário ainda.</p>
        ) : (
          <div className="space-y-3">
            {ocorrencia.comentarios.map((c) => (
              <div
                key={c.id}
                className={`rounded-lg p-3 text-sm ${
                  c.isInternal
                    ? "bg-yellow-50 border border-yellow-200"
                    : c.user.id === ocorrencia.userId
                    ? "bg-gray-50 mr-8"
                    : "bg-blue-50 ml-8"
                }`}
              >
                <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {c.user.role === "SINDICO" || c.user.role === "SUPER_ADMIN" ? "Síndico" : c.user.name}
                    </span>
                    {c.isInternal && (
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">
                        Comentário Interno
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t">
          <ComentarioForm ocorrenciaId={ocorrencia.id} isSindico={true} />
        </div>
      </div>
    </div>
  );
}
