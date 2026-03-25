"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const STATUS_LABELS: Record<string, string> = {
  ABERTA: "Aberta",
  EM_ANDAMENTO: "Em Andamento",
  RESOLVIDA: "Resolvida",
  FECHADA: "Fechada",
  PENDENTE: "Pendente",
  ENTREGUE: "Entregue",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
  CANCELADA: "Cancelada",
  OCUPADA: "Ocupada",
  VAGA: "Vaga",
  BLOQUEADA: "Bloqueada",
  EM_DIA: "Em Dia",
  INADIMPLENTE: "Inadimplente",
};

const CATEGORY_LABELS: Record<string, string> = {
  MANUTENCAO: "Manutenção",
  BARULHO: "Barulho",
  SEGURANCA: "Segurança",
  LIMPEZA: "Limpeza",
  AREAS_COMUNS: "Áreas Comuns",
  OUTROS: "Outros",
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

interface MetricasChartsProps {
  data: {
    unidades: { status: string; count: number }[];
    encomendas: { status: string; count: number }[];
    reservas: { status: string; count: number }[];
    ocorrencias: {
      byStatus: { status: string; count: number }[];
      byCategory: { category: string; count: number }[];
    };
    financeiro: { status: string; count: number }[];
    comunicados: { title: string; reads: number; total: number; createdAt: string }[];
    moradores: { activeLast7: number; activeLast30: number; total: number };
  };
}

export function MetricasCharts({ data }: MetricasChartsProps) {
  const ocorrenciasByStatus = data.ocorrencias.byStatus.map((o) => ({
    name: STATUS_LABELS[o.status] ?? o.status,
    value: o.count,
  }));

  const ocorrenciasByCategory = data.ocorrencias.byCategory.map((o) => ({
    name: CATEGORY_LABELS[o.category] ?? o.category,
    value: o.count,
  }));

  const financeiroData = data.financeiro.map((f) => ({
    name: STATUS_LABELS[f.status] ?? f.status,
    value: f.count,
  }));

  const encomendasData = data.encomendas.map((e) => ({
    name: STATUS_LABELS[e.status] ?? e.status,
    total: e.count,
  }));

  const comunicadosData = data.comunicados.slice(0, 8).map((c) => ({
    title: c.title.length > 20 ? c.title.slice(0, 20) + "…" : c.title,
    lidos: c.reads,
    total: c.total,
  }));

  return (
    <div className="space-y-8">
      {/* Moradores Ativos */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-semibold text-gray-900 mb-4">Moradores Ativos</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-700">{data.moradores.activeLast7}</div>
            <div className="text-sm text-blue-600">Últimos 7 dias</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-700">{data.moradores.activeLast30}</div>
            <div className="text-sm text-green-600">Últimos 30 dias</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-700">{data.moradores.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* Ocorrências por Status */}
      {ocorrenciasByStatus.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Ocorrências por Status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={ocorrenciasByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {ocorrenciasByStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Ocorrências por Categoria */}
      {ocorrenciasByCategory.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Ocorrências por Categoria</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ocorrenciasByCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="Ocorrências" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Encomendas */}
      {encomendasData.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Encomendas por Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={encomendasData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" name="Total" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Financeiro */}
      {financeiroData.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Situação Financeira das Unidades</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={financeiroData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {financeiroData.map((_, i) => (
                  <Cell key={i} fill={["#10b981", "#f59e0b", "#ef4444"][i % 3]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comunicados - Taxa de Leitura */}
      {comunicadosData.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Taxa de Leitura dos Comunicados</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={comunicadosData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="title" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="lidos" name="Lidos" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="total" name="Total Moradores" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
