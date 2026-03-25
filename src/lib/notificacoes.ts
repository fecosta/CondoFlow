import { prisma } from "@/lib/prisma";

type NotificacaoType =
  | "COMUNICADO"
  | "ENCOMENDA"
  | "RESERVA"
  | "OCORRENCIA"
  | "VISITANTE"
  | "SISTEMA";

interface CreateNotificacaoOptions {
  userId: string;
  type: NotificacaoType;
  title: string;
  message: string;
  link?: string;
}

export async function createNotificacao(options: CreateNotificacaoOptions) {
  return prisma.notificacao.create({
    data: {
      userId: options.userId,
      type: options.type,
      title: options.title,
      message: options.message,
      link: options.link,
    },
  });
}

export async function createNotificacaoAsync(options: CreateNotificacaoOptions) {
  createNotificacao(options).catch(() => {});
}
