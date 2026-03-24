import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getTenantId(): Promise<string> {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado");

  if (session.user.role === "SUPER_ADMIN") {
    // Super admin needs condominioId from session (set when switching)
    if (!session.user.condominioId) {
      throw new Error("Selecione um condomínio");
    }
    return session.user.condominioId;
  }

  if (!session.user.condominioId) {
    throw new Error("Usuário não associado a um condomínio");
  }

  return session.user.condominioId;
}

export async function getUserCondominioId(userId: string): Promise<string | null> {
  const condominioUser = await prisma.condominioUser.findFirst({
    where: { userId },
    select: { condominioId: true },
  });
  return condominioUser?.condominioId ?? null;
}
