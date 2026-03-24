import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { comunicadoSchema } from "@/lib/validations/comunicado";
import { getTenantId } from "@/lib/tenant";
import { sendEmailAsync } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));

  const [comunicados, total] = await Promise.all([
    prisma.comunicado.findMany({
      where: { condominioId: tenantId },
      include: {
        _count: { select: { reads: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.comunicado.count({ where: { condominioId: tenantId } }),
  ]);

  return NextResponse.json({ data: comunicados, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const tenantId = await getTenantId();
  const body = await req.json().catch(() => ({}));
  const parsed = comunicadoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });

  const comunicado = await prisma.comunicado.create({
    data: { ...parsed.data, condominioId: tenantId, authorId: session.user.id },
  });

  // Get morador emails and send async
  const moradores = await prisma.morador.findMany({
    where: { unidade: { bloco: { condominioId: tenantId } }, isActive: true, email: { not: null } },
    select: { email: true, name: true },
  });

  const emails = moradores.map((m) => m.email!).filter(Boolean);
  if (emails.length > 0) {
    sendEmailAsync({
      to: emails,
      subject: `Novo Comunicado: ${comunicado.title}`,
      html: `
        <h2>${comunicado.title}</h2>
        <p>${comunicado.content.replace(/\n/g, "<br>")}</p>
        <hr>
        <p><small>Acesse o portal para ver mais comunicados.</small></p>
      `,
    });
  }

  return NextResponse.json(comunicado, { status: 201 });
}
