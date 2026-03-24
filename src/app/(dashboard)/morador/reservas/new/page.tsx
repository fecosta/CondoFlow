import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { NewReservaForm } from "@/components/reservas/new-reserva-form";
import Link from "next/link";

export default async function NewReservaPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();

  const [areas, unidades] = await Promise.all([
    prisma.areaComum.findMany({
      where: { condominioId: tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.unidade.findMany({
      where: { bloco: { condominioId: tenantId } },
      include: { bloco: true },
      orderBy: [{ bloco: { name: "asc" } }, { number: "asc" }],
    }),
  ]);

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <p className="text-sm text-gray-500">
          <Link href="/morador/reservas" className="hover:underline">Reservas</Link>
          {" / "}Nova Reserva
        </p>
        <h1 className="text-2xl font-bold mt-1">Nova Reserva</h1>
      </div>
      <NewReservaForm areas={areas} unidades={unidades} />
    </div>
  );
}
