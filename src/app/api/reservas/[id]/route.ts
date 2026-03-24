import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { z } from "zod";

const updateSchema = z.object({
  action: z.enum(["APROVAR", "REJEITAR", "CANCELAR"]),
  reason: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();

  const reserva = await prisma.reserva.findFirst({
    where: { id: params.id, areaComum: { condominioId: tenantId } },
  });
  if (!reserva) return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { action, reason } = parsed.data;
  const isSindicoOrAdmin = ["SUPER_ADMIN", "SINDICO"].includes(session.user.role);
  const isOwner = reserva.userId === session.user.id;

  if (action === "APROVAR" || action === "REJEITAR") {
    if (!isSindicoOrAdmin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    if (reserva.status !== "PENDENTE") {
      return NextResponse.json({ error: "Apenas reservas pendentes podem ser aprovadas ou rejeitadas" }, { status: 400 });
    }
    await prisma.reserva.update({
      where: { id: params.id },
      data: {
        status: action === "APROVAR" ? "APROVADA" : "REJEITADA",
        rejectReason: action === "REJEITAR" ? reason : undefined,
      },
    });
  } else if (action === "CANCELAR") {
    if (!isSindicoOrAdmin && !isOwner) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    if (!["PENDENTE", "APROVADA"].includes(reserva.status)) {
      return NextResponse.json({ error: "Esta reserva não pode ser cancelada" }, { status: 400 });
    }
    await prisma.reserva.update({
      where: { id: params.id },
      data: { status: "CANCELADA", cancelReason: reason },
    });
  }

  return NextResponse.json({ ok: true });
}
