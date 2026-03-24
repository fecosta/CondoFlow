import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Clock, Users } from "lucide-react";

export default async function AreasComunsPage() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) redirect("/login");

  const tenantId = await getTenantId();

  const areas = await prisma.areaComum.findMany({
    where: { condominioId: tenantId, isActive: true },
    include: {
      _count: { select: { reservas: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Áreas Comuns</h1>
        <Button asChild>
          <Link href="/sindico/areas-comuns/new">
            <Plus className="h-4 w-4 mr-2" /> Nova Área
          </Link>
        </Button>
      </div>

      {areas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nenhuma área comum cadastrada.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {areas.map((a) => (
            <Link key={a.id} href={`/sindico/areas-comuns/${a.id}`}>
              <Card className="hover:shadow-sm transition-shadow cursor-pointer h-full">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="font-semibold">{a.name}</p>
                    <Badge variant={a.requiresApproval ? "secondary" : "default"}>
                      {a.requiresApproval ? "Com aprovação" : "Livre"}
                    </Badge>
                  </div>
                  {a.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{a.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {a.openTime} – {a.closeTime}
                    </span>
                    {a.capacity && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {a.capacity} pessoas
                      </span>
                    )}
                    <span>{a._count.reservas} reservas</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
