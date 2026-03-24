import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Pin } from "lucide-react";

export default async function MoradorComunicadosPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();

  const comunicados = await prisma.comunicado.findMany({
    where: { condominioId: tenantId },
    include: {
      reads: {
        where: { userId: session.user.id },
        select: { readAt: true },
      },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Comunicados</h1>

      {comunicados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nenhum comunicado ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {comunicados.map((c) => {
            const isRead = c.reads.length > 0;
            return (
              <Link key={c.id} href={`/morador/comunicados/${c.id}`}>
                <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                  <CardContent className="pt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {c.isPinned && (
                        <Pin className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                      )}
                      <span
                        className={`truncate text-sm ${
                          isRead ? "text-gray-500" : "font-semibold"
                        }`}
                      >
                        {c.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">
                        {formatDate(c.createdAt)}
                      </span>
                      {!isRead && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                          Novo
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
