import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  breed: z.string().optional(),
  size: z.enum(["PEQUENO", "MEDIO", "GRANDE"]).optional(),
  unidadeId: z.string().min(1, "Unidade obrigatória"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "SINDICO"].includes(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const tenantId = await getTenantId();
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const unidade = await prisma.unidade.findFirst({
    where: { id: parsed.data.unidadeId, bloco: { condominioId: tenantId } },
  });
  if (!unidade) return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 });

  const pet = await prisma.pet.create({ data: parsed.data });
  return NextResponse.json(pet, { status: 201 });
}
