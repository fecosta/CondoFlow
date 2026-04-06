import { z } from "zod";

export const encomendaSchema = z.object({
  unidadeId: z.string().min(1, "Unidade obrigatória"),
  description: z.string().optional(),
  remetente: z.string().optional(),
  transportadora: z.string().optional(),
  codigoRastreio: z.string().optional(),
  scanConfidence: z.number().min(0).max(1).optional(),
  wasScanned: z.boolean().optional(),
  labelImageUrl: z.string().optional(),
});

export const registrarRetiradaSchema = z.object({
  pickedUpName: z.string().min(2, "Nome de quem retirou é obrigatório"),
});

export type EncomendaInput = z.infer<typeof encomendaSchema>;
export type RegistrarRetiradaInput = z.infer<typeof registrarRetiradaSchema>;
