import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { NewBlocoDialog, EditBlocoDialog, DeleteBlocoButton } from "@/components/blocos/bloco-dialogs";

export default async function SindocoBlocosPage() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) redirect("/login");

  const tenantId = await getTenantId();

  const blocos = await prisma.bloco.findMany({
    where: { condominioId: tenantId },
    include: { _count: { select: { unidades: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blocos / Torres</h1>
          <p className="text-sm text-gray-500">{blocos.length} bloco(s)</p>
        </div>
        <NewBlocoDialog />
      </div>

      {blocos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nenhum bloco cadastrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {blocos.map((b) => (
            <Card key={b.id}>
              <CardContent className="pt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{b.name}</p>
                  <p className="text-xs text-gray-500">{b._count.unidades} unidade(s)</p>
                </div>
                <div className="flex items-center gap-1">
                  <EditBlocoDialog id={b.id} currentName={b.name} />
                  <DeleteBlocoButton id={b.id} name={b.name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
