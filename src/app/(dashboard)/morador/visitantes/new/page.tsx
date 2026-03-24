import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { NewVisitanteForm } from "@/components/visitantes/new-visitante-form";
import Link from "next/link";

export default async function NewVisitantePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();

  const unidades = await prisma.unidade.findMany({
    where: { bloco: { condominioId: tenantId } },
    include: { bloco: true },
    orderBy: [{ bloco: { name: "asc" } }, { number: "asc" }],
  });

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <p className="text-sm text-gray-500">
          <Link href="/morador/visitantes" className="hover:underline">Visitantes</Link>
          {" / "}Pré-cadastrar
        </p>
        <h1 className="text-2xl font-bold mt-1">Pré-cadastrar Visitante</h1>
      </div>
      <NewVisitanteForm unidades={unidades} />
    </div>
  );
}
