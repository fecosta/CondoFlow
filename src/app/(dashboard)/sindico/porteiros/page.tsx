import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  NewPorteiroDialog,
  EditPorteiroDialog,
  DeletePorteiroButton,
} from "@/components/porteiros/porteiro-dialogs";

const turnoLabel: Record<string, string> = {
  MANHA: "Manhã",
  TARDE: "Tarde",
  NOITE: "Noite",
  INTEGRAL: "Integral",
  "12x36": "12x36",
};

export default async function SindicoPorteirosPage() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) redirect("/login");

  const tenantId = await getTenantId();

  const porteiros = await prisma.condominioUser.findMany({
    where: { condominioId: tenantId, role: "PORTEIRO" },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, turno: true, isActive: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Porteiros</h1>
          <p className="text-sm text-gray-500">{porteiros.length} porteiro(s) cadastrado(s)</p>
        </div>
        <NewPorteiroDialog />
      </div>

      {porteiros.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nenhum porteiro cadastrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {porteiros.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{p.user.name}</p>
                  <p className="text-xs text-gray-500">{p.user.email}</p>
                  {(p.user.phone || p.user.turno) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[p.user.phone, p.user.turno ? turnoLabel[p.user.turno] : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={p.user.isActive ? "default" : "secondary"}>
                    {p.user.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                  <EditPorteiroDialog
                    assignmentId={p.id}
                    currentName={p.user.name}
                    currentPhone={p.user.phone}
                    currentTurno={p.user.turno}
                  />
                  <DeletePorteiroButton assignmentId={p.id} name={p.user.name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
