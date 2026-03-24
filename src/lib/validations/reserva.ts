import { z } from "zod";

export const areaComumSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  requiresApproval: z.boolean().optional(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM").optional(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM").optional(),
  maxDurationHours: z.number().int().positive().optional(),
  minAdvanceDays: z.number().int().min(0).optional(),
  maxAdvanceDays: z.number().int().positive().optional(),
});

export const reservaSchema = z.object({
  areaComumId: z.string().min(1, "Área obrigatória"),
  unidadeId: z.string().min(1, "Unidade obrigatória"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
});

export type AreaComumInput = z.infer<typeof areaComumSchema>;
export type ReservaInput = z.infer<typeof reservaSchema>;
