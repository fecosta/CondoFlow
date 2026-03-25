import { z } from "zod";

export const ocorrenciaSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  category: z.enum(["MANUTENCAO", "BARULHO", "SEGURANCA", "LIMPEZA", "AREAS_COMUNS", "OUTROS"]),
  priority: z.enum(["BAIXA", "MEDIA", "ALTA", "URGENTE"]),
  unidadeId: z.string().min(1, "Unidade obrigatória"),
  imageUrls: z.array(z.string()).max(3).optional(),
});

export type OcorrenciaInput = z.infer<typeof ocorrenciaSchema>;

export const ocorrenciaComentarioSchema = z.object({
  content: z.string().min(1, "Comentário não pode ser vazio"),
  isInternal: z.boolean().default(false),
});

export type OcorrenciaComentarioInput = z.infer<typeof ocorrenciaComentarioSchema>;

export const ocorrenciaStatusSchema = z.object({
  action: z.enum(["EM_ANDAMENTO", "RESOLVIDA", "FECHADA", "REABRIR"]),
  resolution: z.string().optional(),
});

export type OcorrenciaStatusInput = z.infer<typeof ocorrenciaStatusSchema>;
