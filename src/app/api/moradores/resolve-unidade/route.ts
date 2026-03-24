import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();
  const { searchParams } = new URL(req.url);
  const bloco = searchParams.get("bloco") ?? "";
  const number = searchParams.get("number") ?? "";

  const unidade = await prisma.unidade.findFirst({
    where: {
      number,
      bloco: { name: { contains: bloco }, condominioId: tenantId },
    },
  });

  if (!unidade) return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });

  return NextResponse.json({ unidadeId: unidade.id });
}
