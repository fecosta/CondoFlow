import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registrarRetiradaSchema } from "@/lib/validations/encomenda";
import { getTenantId } from "@/lib/tenant";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!["SUPER_ADMIN", "SINDICO", "PORTEIRO"].includes(session.user.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tenantId = await getTenantId();
  const body = await req.json().catch(() => ({}));
  const parsed = registrarRetiradaSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const encomenda = await prisma.encomenda.findFirst({
    where: { id: params.id, unidade: { bloco: { condominioId: tenantId } } },
  });
  if (!encomenda) return NextResponse.json({ error: "Encomenda não encontrada" }, { status: 404 });
  if (encomenda.status === "ENTREGUE") return NextResponse.json({ error: "Encomenda já foi retirada" }, { status: 400 });

  const updated = await prisma.encomenda.update({
    where: { id: params.id },
    data: {
      status: "ENTREGUE",
      pickedUpById: session.user.id,
      pickedUpName: parsed.data.pickedUpName,
      pickedUpAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
