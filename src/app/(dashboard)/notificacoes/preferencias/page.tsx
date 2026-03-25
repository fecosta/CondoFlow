import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PreferenciasForm } from "./preferencias-form";

const NOTIFICATION_TYPES = ["COMUNICADO", "ENCOMENDA", "RESERVA", "OCORRENCIA", "VISITANTE", "SISTEMA"] as const;

const TYPE_LABELS: Record<string, string> = {
  COMUNICADO: "Comunicados",
  ENCOMENDA: "Encomendas",
  RESERVA: "Reservas",
  OCORRENCIA: "Ocorrências",
  VISITANTE: "Visitantes",
  SISTEMA: "Sistema",
};

export default async function PreferenciasNotificacaoPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const existing = await prisma.notificacaoPreferencia.findMany({
    where: { userId: session.user.id },
  });

  const preferences = NOTIFICATION_TYPES.map((type) => {
    const found = existing.find((p) => p.type === type);
    return {
      type,
      label: TYPE_LABELS[type],
      email: found?.email ?? true,
      digest: found?.digest ?? false,
    };
  });

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link href="/notificacoes" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar às Notificações
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Preferências de Notificação</h1>
        <p className="text-sm text-gray-500 mt-1">Escolha quais notificações deseja receber por e-mail</p>
      </div>

      <PreferenciasForm preferences={preferences} />
    </div>
  );
}
