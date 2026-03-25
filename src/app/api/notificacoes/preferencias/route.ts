import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const NOTIFICATION_TYPES = ["COMUNICADO", "ENCOMENDA", "RESERVA", "OCORRENCIA", "VISITANTE", "SISTEMA"] as const;

const preferenciaSchema = z.object({
  type: z.enum(NOTIFICATION_TYPES),
  email: z.boolean(),
  digest: z.boolean(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const existing = await prisma.notificacaoPreferencia.findMany({
    where: { userId: session.user.id },
  });

  // Return defaults for types not yet configured
  const preferences = NOTIFICATION_TYPES.map((type) => {
    const found = existing.find((p) => p.type === type);
    return found ?? { userId: session.user.id, type, email: true, digest: false };
  });

  return NextResponse.json(preferences);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = preferenciaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { type, email, digest } = parsed.data;

  const pref = await prisma.notificacaoPreferencia.upsert({
    where: { userId_type: { userId: session.user.id, type } },
    create: { userId: session.user.id, type, email, digest },
    update: { email, digest },
  });

  return NextResponse.json(pref);
}
