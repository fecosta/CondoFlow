import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { ocorrenciaStatusSchema } from "@/lib/validations/ocorrencia";
import { createNotificacaoAsync } from "@/lib/notificacoes";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();

  const ocorrencia = await prisma.ocorrencia.findFirst({
    where: { id: params.id, unidade: { bloco: { condominioId: tenantId } } },
    include: {
      unidade: { include: { bloco: true } },
      user: { select: { id: true, name: true, email: true } },
      comentarios: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
        where: session.user.role === "MORADOR" ? { isInternal: false } : {},
      },
      imagens: true,
    },
  });

  if (!ocorrencia) return NextResponse.json({ error: "Ocorrência não encontrada" }, { status: 404 });

  // Moradores can only see their own ocorrências
  if (session.user.role === "MORADOR" && ocorrencia.userId !== session.user.id) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  return NextResponse.json(ocorrencia);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();
  const isSindico = ["SINDICO", "SUPER_ADMIN"].includes(session.user.role);

  if (!isSindico) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const ocorrencia = await prisma.ocorrencia.findFirst({
    where: { id: params.id, unidade: { bloco: { condominioId: tenantId } } },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!ocorrencia) return NextResponse.json({ error: "Ocorrência não encontrada" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = ocorrenciaStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { action, resolution } = parsed.data;

  const statusMap: Record<string, string> = {
    EM_ANDAMENTO: "EM_ANDAMENTO",
    RESOLVIDA: "RESOLVIDA",
    FECHADA: "FECHADA",
    REABRIR: "ABERTA",
  };

  const updated = await prisma.ocorrencia.update({
    where: { id: params.id },
    data: {
      status: statusMap[action] as "ABERTA" | "EM_ANDAMENTO" | "RESOLVIDA" | "FECHADA",
      ...(action === "RESOLVIDA" && resolution ? { resolution } : {}),
    },
  });

  const statusLabels: Record<string, string> = {
    EM_ANDAMENTO: "Em Andamento",
    RESOLVIDA: "Resolvida",
    FECHADA: "Fechada",
    REABRIR: "Aberta",
  };

  createNotificacaoAsync({
    userId: ocorrencia.userId,
    type: "OCORRENCIA",
    title: "Ocorrência atualizada",
    message: `Sua ocorrência "${ocorrencia.title}" foi marcada como ${statusLabels[action]}.`,
    link: `/morador/ocorrencias/${params.id}`,
  });

  return NextResponse.json(updated);
}
