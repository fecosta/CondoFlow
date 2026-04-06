import { prisma } from "@/lib/prisma";

interface MatchResult {
  unidadeId: string;
  blocoName: string;
  unidadeNumber: string;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/\b(apto?|apartamento|ap|bloco|torre|unidade|unit|apt)\b/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNumbers(text: string): string[] {
  return text.match(/\d+/g) ?? [];
}

/**
 * Attempts to match an AI-extracted unit string to actual units in the condomínio.
 * Examples: "Apt 304" → Unidade "304", "Bloco A 201" → Bloco "Bloco A", Unidade "201"
 */
export async function matchUnidade(
  extractedText: string | null,
  condominioId: string
): Promise<MatchResult | null> {
  if (!extractedText) return null;

  const unidades = await prisma.unidade.findMany({
    where: { bloco: { condominioId } },
    include: { bloco: true },
  });

  if (unidades.length === 0) return null;

  const normalizedInput = normalize(extractedText);
  const inputNumbers = extractNumbers(normalizedInput);

  if (inputNumbers.length === 0) return null;

  // Find units whose number matches any extracted number
  const candidates = unidades.filter((u) => inputNumbers.includes(u.number));

  if (candidates.length === 0) return null;

  // If unique match, return immediately
  if (candidates.length === 1) {
    return {
      unidadeId: candidates[0].id,
      blocoName: candidates[0].bloco.name,
      unidadeNumber: candidates[0].number,
    };
  }

  // Multiple candidates — try to match bloco name
  const normalizedBlocoTokens = normalizedInput
    .split(" ")
    .filter((t) => t.length > 0);

  const blocoMatch = candidates.find((u) => {
    const normalizedBloco = normalize(u.bloco.name);
    return normalizedBlocoTokens.some((token) => normalizedBloco.includes(token));
  });

  if (blocoMatch) {
    return {
      unidadeId: blocoMatch.id,
      blocoName: blocoMatch.bloco.name,
      unidadeNumber: blocoMatch.number,
    };
  }

  // Return first candidate if no bloco match
  return {
    unidadeId: candidates[0].id,
    blocoName: candidates[0].bloco.name,
    unidadeNumber: candidates[0].number,
  };
}
