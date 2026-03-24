import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ReservaActions } from "@/components/reservas/reserva-actions";
import { formatDate } from "@/lib/utils";

const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
  CANCELADA: "Cancelada",
};
const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDENTE: "secondary",
  APROVADA: "default",
  REJEITADA: "destructive",
  CANCELADA: "outline",
};

export default async function MoradorReservasPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;

  const where = {
    userId: session.user.id,
    areaComum: { condominioId: tenantId },
  };

  const [reservas, total] = await Promise.all([
    prisma.reserva.findMany({
      where,
      include: {
        areaComum: { select: { name: true } },
        unidade: { include: { bloco: true } },
      },
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reserva.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Minhas Reservas</h1>
        <Button asChild>
          <Link href="/morador/reservas/new">
            <Plus className="h-4 w-4 mr-2" /> Nova Reserva
          </Link>
        </Button>
      </div>

      {reservas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Você não possui reservas.{" "}
            <Link href="/morador/reservas/new" className="text-blue-600 hover:underline">
              Fazer uma reserva
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {reservas.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{r.areaComum.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(r.date)} · {r.startTime}–{r.endTime}
                    </p>
                    <p className="text-xs text-gray-400">
                      {r.unidade.bloco.name} — Unidade {r.unidade.number}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant[r.status]}>{statusLabel[r.status]}</Badge>
                    {["PENDENTE", "APROVADA"].includes(r.status) && (
                      <ReservaActions reservaId={r.id} cancelOnly />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" asChild><Link href={`?page=${page - 1}`}>Anterior</Link></Button>
          )}
          <span className="flex items-center text-sm text-gray-500">Página {page} de {totalPages}</span>
          {page < totalPages && (
            <Button variant="outline" asChild><Link href={`?page=${page + 1}`}>Próxima</Link></Button>
          )}
        </div>
      )}
    </div>
  );
}
