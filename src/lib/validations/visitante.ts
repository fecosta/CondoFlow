import { z } from "zod";

export const visitanteSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  document: z.string().optional(),
  unidadeId: z.string().min(1, "Unidade obrigatória"),
  type: z.enum(["PONTUAL", "RECORRENTE"]),
  expectedDate: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type VisitanteInput = z.infer<typeof visitanteSchema>;
