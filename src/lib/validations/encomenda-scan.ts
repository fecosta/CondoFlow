import { z } from "zod";

export const scanLabelRequestSchema = z.object({
  image: z
    .string()
    .min(1, "Imagem é obrigatória")
    .max(7_000_000, "Imagem muito grande. O tamanho máximo é 5MB."),
});

export const confidenceLevelSchema = z.enum(["high", "medium", "low"]);

export const scanLabelResponseSchema = z.object({
  destinatario: z.string().nullable(),
  unidade: z.string().nullable(),
  remetente: z.string().nullable(),
  transportadora: z.string().nullable(),
  codigoRastreio: z.string().nullable(),
  tipoEncomenda: z
    .enum(["envelope", "caixa_pequena", "caixa_media", "caixa_grande", "sacola", "tubo", "outro"])
    .nullable(),
  confidence: z.object({
    destinatario: confidenceLevelSchema,
    unidade: confidenceLevelSchema,
    remetente: confidenceLevelSchema,
    transportadora: confidenceLevelSchema,
    codigoRastreio: confidenceLevelSchema,
  }),
});

export type ScanLabelRequest = z.infer<typeof scanLabelRequestSchema>;
export type ScanLabelResponse = z.infer<typeof scanLabelResponseSchema>;
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;
