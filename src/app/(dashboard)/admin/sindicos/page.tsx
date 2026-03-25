import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewSindicoDialog } from "@/components/sindicos/new-sindico-dialog";
import { EditSindicoDialog } from "@/components/sindicos/edit-sindico-dialog";
import { RemoveSindicoButton } from "@/components/sindicos/remove-sindico-button";

export default async function AdminSindicosPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const [assignments, condominios] = await Promise.all([
    prisma.condominioUser.findMany({
      where: { role: "SINDICO" },
      include: {
        user: { select: { id: true, name: true, email: true, isActive: true } },
        condominio: { select: { id: true, name: true } },
      },
      orderBy: { condominio: { name: "asc" } },
    }),
    prisma.condominio.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Síndicos</h1>
          <p className="text-sm text-gray-500">{assignments.length} síndico(s) cadastrado(s)</p>
        </div>
        <NewSindicoDialog condominios={condominios} />
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nenhum síndico cadastrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <Card key={a.id}>
              <CardContent className="pt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{a.user.name}</p>
                  <p className="text-xs text-gray-500">{a.user.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.condominio.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.user.isActive ? "default" : "secondary"}>
                    {a.user.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                  <EditSindicoDialog assignmentId={a.id} currentName={a.user.name} currentEmail={a.user.email} />
                  <RemoveSindicoButton assignmentId={a.id} name={a.user.name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
