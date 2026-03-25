import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { ocorrenciaComentarioSchema } from "@/lib/validations/ocorrencia";
import { createNotificacaoAsync } from "@/lib/notificacoes";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const tenantId = await getTenantId();

  const ocorrencia = await prisma.ocorrencia.findFirst({
    where: { id: params.id, unidade: { bloco: { condominioId: tenantId } } },
    include: { user: { select: { id: true } } },
  });
  if (!ocorrencia) return NextResponse.json({ error: "Ocorrência não encontrada" }, { status: 404 });

  // Moradores can only comment on their own ocorrências and cannot post internal comments
  const isMorador = session.user.role === "MORADOR";
  if (isMorador && ocorrencia.userId !== session.user.id) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = ocorrenciaComentarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { content, isInternal } = parsed.data;

  const comentario = await prisma.ocorrenciaComentario.create({
    data: {
      content,
      isInternal: isMorador ? false : isInternal,
      ocorrenciaId: params.id,
      userId: session.user.id,
    },
    include: { user: { select: { id: true, name: true, role: true } } },
  });

  // Notify the other party (síndico commenting → notify morador; morador → notify síndico is skipped for simplicity)
  if (!isMorador && !isInternal) {
    createNotificacaoAsync({
      userId: ocorrencia.userId,
      type: "OCORRENCIA",
      title: "Nova resposta na sua ocorrência",
      message: `O síndico respondeu à sua ocorrência.`,
      link: `/morador/ocorrencias/${params.id}`,
    });
  }

  return NextResponse.json(comentario, { status: 201 });
}
