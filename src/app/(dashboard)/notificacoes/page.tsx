import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { MarkAllReadButton } from "./mark-all-read-button";

const TYPE_LABELS: Record<string, string> = {
  COMUNICADO: "Comunicado",
  ENCOMENDA: "Encomenda",
  RESERVA: "Reserva",
  OCORRENCIA: "Ocorrência",
  VISITANTE: "Visitante",
  SISTEMA: "Sistema",
};

export default async function NotificacoesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const notificacoes = await prisma.notificacao.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notificacoes.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">{unreadCount} não lida{unreadCount !== 1 ? "s" : ""}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && <MarkAllReadButton />}
          <Link href="/notificacoes/preferencias" className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2">
            Preferências
          </Link>
        </div>
      </div>

      {notificacoes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">Nenhuma notificação</p>
          <p className="text-sm mt-1">Você está em dia!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notificacoes.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg border p-4 ${n.isRead ? "bg-white" : "bg-blue-50 border-blue-200"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[n.type] ?? n.type}
                    </span>
                    {!n.isRead && (
                      <span className="text-xs font-medium text-blue-600">● Nova</span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 mt-1">{n.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                  {n.link && (
                    <Link href={n.link} className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                      Ver detalhes →
                    </Link>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{formatDateTime(n.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
