import { z } from "zod";

export const condominioSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

export const blocoSchema = z.object({
  name: z.string().min(1, "Nome do bloco obrigatório"),
  condominioId: z.string().min(1, "Condomínio obrigatório"),
});

export const unidadeSchema = z.object({
  number: z.string().min(1, "Número da unidade obrigatório"),
  blocoId: z.string().min(1, "Bloco obrigatório"),
  status: z.enum(["OCUPADA", "VAGA", "BLOQUEADA"]).default("VAGA"),
});

export const moradorSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  unidadeId: z.string().min(1, "Unidade obrigatória"),
  vinculo: z.enum(["PROPRIETARIO", "INQUILINO", "DEPENDENTE"]).default("PROPRIETARIO"),
});

export type CondominioInput = z.infer<typeof condominioSchema>;
export type BlocoInput = z.infer<typeof blocoSchema>;
export type UnidadeInput = z.infer<typeof unidadeSchema>;
export type MoradorInput = z.infer<typeof moradorSchema>;
