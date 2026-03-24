import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getTenantId } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

export default async function MoradorComunicadoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const tenantId = await getTenantId();

  const comunicado = await prisma.comunicado.findFirst({
    where: { id: params.id, condominioId: tenantId },
  });

  if (!comunicado) notFound();

  // Register read
  await prisma.comunicadoRead.upsert({
    where: {
      comunicadoId_userId: {
        comunicadoId: params.id,
        userId: session.user.id,
      },
    },
    create: { comunicadoId: params.id, userId: session.user.id },
    update: {},
  });

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-gray-500">
        <Link href="/morador/comunicados" className="hover:underline">
          Comunicados
        </Link>
        {" / "}
        {comunicado.title}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>{comunicado.title}</CardTitle>
          <p className="text-xs text-gray-500">
            {formatDateTime(comunicado.createdAt)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            {comunicado.content.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
