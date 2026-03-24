import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Plus, Building2 } from "lucide-react";

export default async function AdminCondominiosPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const page = Math.max(1, Number(searchParams.page ?? 1));
  const limit = 20;
  const search = searchParams.search ?? "";

  const where = search ? { name: { contains: search } } : {};

  const [condominios, total] = await Promise.all([
    prisma.condominio.findMany({
      where,
      include: {
        _count: { select: { blocos: true, condominioUsers: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.condominio.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Condomínios</h1>
        <Button asChild>
          <Link href="/admin/condominios/new">
            <Plus className="h-4 w-4 mr-2" /> Novo Condomínio
          </Link>
        </Button>
      </div>

      <p className="text-sm text-gray-500">{total} condomínios cadastrados</p>

      {condominios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Nenhum condomínio cadastrado ainda.</p>
            <Button asChild className="mt-4">
              <Link href="/admin/condominios/new">Criar primeiro condomínio</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {condominios.map((c) => (
            <Link key={c.id} href={`/admin/condominios/${c.id}`}>
              <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="pt-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    {c.city && <p className="text-xs text-gray-500">{c.city}, {c.state}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {c._count.blocos} blocos · {c._count.condominioUsers} usuários
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.isActive ? "default" : "secondary"}>
                      {c.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" asChild>
              <Link href={`?page=${page - 1}`}>Anterior</Link>
            </Button>
          )}
          <span className="flex items-center text-sm text-gray-500">Página {page} de {totalPages}</span>
          {page < totalPages && (
            <Button variant="outline" asChild>
              <Link href={`?page=${page + 1}`}>Próxima</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
