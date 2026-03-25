import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { z } from "zod";

const financeiroSchema = z.object({
  statusFinanceiro: z.enum(["EM_DIA", "PENDENTE", "INADIMPLENTE"]),
  obsFinanceiro: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const isSindico = ["SINDICO", "SUPER_ADMIN"].includes(session.user.role);
  if (!isSindico) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tenantId = await getTenantId();

  const unidade = await prisma.unidade.findFirst({
    where: { id: params.id, bloco: { condominioId: tenantId } },
  });
  if (!unidade) return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = financeiroSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { statusFinanceiro, obsFinanceiro } = parsed.data;

  const updated = await prisma.unidade.update({
    where: { id: params.id },
    data: { statusFinanceiro, obsFinanceiro },
  });

  await prisma.auditLog.create({
    data: {
      action: "UPDATE_FINANCEIRO",
      entity: "Unidade",
      entityId: params.id,
      details: JSON.stringify({ statusFinanceiro, obsFinanceiro }),
      userId: session.user.id,
    },
  });

  return NextResponse.json(updated);
}
