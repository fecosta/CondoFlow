import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
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

const PRIORITY_LABELS: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

const PRIORITY_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  BAIXA: "outline",
  MEDIA: "secondary",
  ALTA: "default",
  URGENTE: "destructive",
};

const CATEGORY_LABELS: Record<string, string> = {
  MANUTENCAO: "Manutenção",
  BARULHO: "Barulho",
  SEGURANCA: "Segurança",
  LIMPEZA: "Limpeza",
  AREAS_COMUNS: "Áreas Comuns",
  OUTROS: "Outros",
};

export default async function SindicoOcorrenciasPage({
  searchParams,
}: {
  searchParams: { status?: string; category?: string; priority?: string; blocoId?: string; unidadeId?: string; q?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();
  const { status, category, priority, blocoId, unidadeId, q } = searchParams;

  const where: Record<string, unknown> = {
    unidade: {
      bloco: { condominioId: tenantId },
      ...(blocoId ? { blocoId } : {}),
      ...(unidadeId ? { id: unidadeId } : {}),
    },
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(priority ? { priority } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }, { user: { name: { contains: q } } }] } : {}),
  };

  const [ocorrencias, counts, blocos, unidades] = await Promise.all([
    prisma.ocorrencia.findMany({
      where,
      include: {
        unidade: { include: { bloco: true } },
        user: { select: { id: true, name: true } },
        _count: { select: { comentarios: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
    }),
    prisma.ocorrencia.groupBy({
      by: ["status"],
      where: { unidade: { bloco: { condominioId: tenantId } } },
      _count: { status: true },
    }),
    prisma.bloco.findMany({ where: { condominioId: tenantId }, orderBy: { name: "asc" } }),
    prisma.unidade.findMany({
      where: { bloco: { condominioId: tenantId }, ...(blocoId ? { blocoId } : {}) },
      include: { bloco: true },
      orderBy: [{ bloco: { name: "asc" } }, { number: "asc" }],
    }),
  ]);

  const statusCounts = Object.fromEntries(counts.map((c) => [c.status, c._count.status]));

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { status, category, priority, blocoId, unidadeId, q, ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    return `/sindico/ocorrencias${params.toString() ? `?${params}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ocorrências</h1>
        <p className="text-sm text-gray-500 mt-1">Gerenciar chamados e solicitações dos moradores</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: "ABERTA", label: "Abertas", color: "bg-red-50 border-red-200 text-red-700" },
          { key: "EM_ANDAMENTO", label: "Em Andamento", color: "bg-blue-50 border-blue-200 text-blue-700" },
          { key: "RESOLVIDA", label: "Resolvidas", color: "bg-green-50 border-green-200 text-green-700" },
          { key: "FECHADA", label: "Fechadas", color: "bg-gray-50 border-gray-200 text-gray-700" },
        ].map(({ key, label, color }) => (
          <Link key={key} href={buildHref({ status: key, category: undefined, priority: undefined })} className={`border rounded-lg p-3 text-center hover:opacity-80 transition-opacity ${color}`}>
            <div className="text-2xl font-bold">{statusCounts[key] ?? 0}</div>
            <div className="text-sm">{label}</div>
          </Link>
        ))}
      </div>

      {/* Search */}
      <SearchInput placeholder="Buscar por título, descrição ou morador..." defaultValue={q} />

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-500">Categoria:</span>
        <Link href={buildHref({ category: undefined })} className={`px-3 py-1 rounded-full text-sm border ${!category ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 hover:bg-gray-50"}`}>Todas</Link>
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <Link key={value} href={buildHref({ category: value })} className={`px-3 py-1 rounded-full text-sm border ${category === value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            {label}
          </Link>
        ))}
      </div>

      {/* Bloco + Unidade filters */}
      {blocos.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm text-gray-500">Bloco:</span>
          <Link href={buildHref({ blocoId: undefined, unidadeId: undefined })}>
            <Badge variant={!blocoId ? "default" : "outline"} className="cursor-pointer">Todos</Badge>
          </Link>
          {blocos.map((b) => (
            <Link key={b.id} href={buildHref({ blocoId: b.id, unidadeId: undefined })}>
              <Badge variant={blocoId === b.id ? "default" : "outline"} className="cursor-pointer">{b.name}</Badge>
            </Link>
          ))}
          {blocoId && (
            <>
              <span className="text-sm text-gray-500 ml-2">Unidade:</span>
              <Link href={buildHref({ unidadeId: undefined })}>
                <Badge variant={!unidadeId ? "default" : "outline"} className="cursor-pointer">Todas</Badge>
              </Link>
              {unidades.map((u) => (
                <Link key={u.id} href={buildHref({ unidadeId: u.id })}>
                  <Badge variant={unidadeId === u.id ? "default" : "outline"} className="cursor-pointer">{u.number}</Badge>
                </Link>
              ))}
            </>
          )}
        </div>
      )}

      {/* List */}
      {ocorrencias.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><p>Nenhuma ocorrência encontrada.</p></div>
      ) : (
        <div className="space-y-3">
          {ocorrencias.map((o) => (
            <Link key={o.id} href={`/sindico/ocorrencias/${o.id}`} className="block bg-white border rounded-lg p-4 hover:border-gray-400 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{o.title}</span>
                    <Badge variant={STATUS_COLORS[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                    <Badge variant={PRIORITY_COLORS[o.priority]}>{PRIORITY_LABELS[o.priority]}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{o.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
                    <span>{CATEGORY_LABELS[o.category]}</span>
                    <span>·</span>
                    <span>{o.unidade.bloco.name} – Unidade {o.unidade.number}</span>
                    <span>·</span>
                    <span>{o.user.name}</span>
                    <span>·</span>
                    <span>{formatDateTime(o.createdAt)}</span>
                    {o._count.comentarios > 0 && <><span>·</span><span>{o._count.comentarios} comentário{o._count.comentarios !== 1 ? "s" : ""}</span></>}
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
