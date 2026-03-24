import { z } from "zod";

export const comunicadoSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  content: z.string().min(10, "Conteúdo deve ter pelo menos 10 caracteres"),
  isPinned: z.boolean().optional(),
});

export type ComunicadoInput = z.infer<typeof comunicadoSchema>;
