import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { ScanEncomendaFlow } from "@/components/encomendas/scan-encomenda-flow";

export default async function NovaEncomendaPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();

  const unidades = await prisma.unidade.findMany({
    where: { bloco: { condominioId: tenantId } },
    include: { bloco: true },
    orderBy: [{ bloco: { name: "asc" } }, { number: "asc" }],
  });

  return <ScanEncomendaFlow unidades={unidades} />;
}
