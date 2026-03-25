import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { ocorrenciaSchema } from "@/lib/validations/ocorrencia";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const priority = searchParams.get("priority");
  const unidadeId = searchParams.get("unidadeId");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 20;

  const isMorador = session.user.role === "MORADOR";

  const where: Record<string, unknown> = {
    unidade: { bloco: { condominioId: tenantId } },
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(priority ? { priority } : {}),
    ...(unidadeId ? { unidadeId } : {}),
    ...(isMorador ? { userId: session.user.id } : {}),
  };

  const [ocorrencias, total] = await Promise.all([
    prisma.ocorrencia.findMany({
      where,
      include: {
        unidade: { include: { bloco: true } },
        user: { select: { id: true, name: true } },
        _count: { select: { comentarios: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ocorrencia.count({ where }),
  ]);

  return NextResponse.json({ data: ocorrencias, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();
  const body = await req.json().catch(() => ({}));
  const parsed = ocorrenciaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { title, description, category, priority, unidadeId, imageUrls } = parsed.data;

  const unidade = await prisma.unidade.findFirst({
    where: { id: unidadeId, bloco: { condominioId: tenantId } },
  });
  if (!unidade) return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });

  const ocorrencia = await prisma.ocorrencia.create({
    data: {
      title,
      description,
      category,
      priority,
      unidadeId,
      userId: session.user.id,
      imagens: imageUrls?.length
        ? { create: imageUrls.map((url) => ({ url })) }
        : undefined,
    },
  });

  return NextResponse.json(ocorrencia, { status: 201 });
}
