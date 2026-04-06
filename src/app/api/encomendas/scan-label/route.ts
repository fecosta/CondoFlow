import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant";
import { scanLabelRequestSchema, scanLabelResponseSchema } from "@/lib/validations/encomenda-scan";
import { matchUnidade } from "@/lib/encomendas/match-unidade";

const SYSTEM_PROMPT = `You are a package label reader for a Brazilian residential building management system.
Analyze the package label image and extract the following information.
Return ONLY a valid JSON object with no additional text, markdown, or explanation.

JSON schema:
{
  "destinatario": "recipient full name",
  "unidade": "apartment/unit identifier (e.g., 'Apt 304', 'Bloco A 201', '101')",
  "remetente": "sender name or company",
  "transportadora": "carrier/shipping company (e.g., Correios, Jadlog, Loggi, Azul Cargo)",
  "codigoRastreio": "tracking code if visible",
  "tipoEncomenda": "package type: envelope | caixa_pequena | caixa_media | caixa_grande | sacola | tubo | outro",
  "confidence": {
    "destinatario": "high" | "medium" | "low",
    "unidade": "high" | "medium" | "low",
    "remetente": "high" | "medium" | "low",
    "transportadora": "high" | "medium" | "low",
    "codigoRastreio": "high" | "medium" | "low"
  }
}

Rules:
- If a field is not visible or unreadable, set it to null
- For "unidade", extract any apartment/unit number you can find in the address
- For Brazilian carriers, normalize names: "Correios" (not "ECT"), "Jadlog", "Loggi", etc.
- Tracking codes often start with letters and contain digits (e.g., BR123456789CD, NB012345678BR)
- Set confidence to "low" for any field you had to guess or partially read
- Set confidence to "high" only when clearly legible`;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!["SUPER_ADMIN", "SINDICO", "PORTEIRO"].includes(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const tenantId = await getTenantId();

  const body = await req.json().catch(() => ({}));
  const parsed = scanLabelRequestSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dados inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { image } = parsed.data;

  // Detect media type and strip data URI prefix
  let mediaType: "image/jpeg" | "image/png" = "image/jpeg";
  let base64Data = image;

  if (image.startsWith("data:image/png")) {
    mediaType = "image/png";
    base64Data = image.replace(/^data:image\/png;base64,/, "");
  } else if (image.startsWith("data:image/jpeg") || image.startsWith("data:image/jpg")) {
    mediaType = "image/jpeg";
    base64Data = image.replace(/^data:image\/jpe?g;base64,/, "");
  }

  // Log scan attempt
  prisma.auditLog
    .create({
      data: {
        action: "ENCOMENDA_SCAN_LABEL",
        entity: "Encomenda",
        userId: session.user.id,
        details: JSON.stringify({ condominioId: tenantId }),
      },
    })
    .catch(() => {});

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: "text",
              text: "Analise esta etiqueta de encomenda e extraia os dados conforme o esquema JSON especificado.",
            },
          ],
        },
      ],
    });

    const rawText = response.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("")
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");

    const jsonResult = JSON.parse(rawText);
    const validated = scanLabelResponseSchema.safeParse(jsonResult);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Não foi possível ler a etiqueta. Tente novamente ou preencha manualmente." },
        { status: 422 }
      );
    }

    const match = await matchUnidade(validated.data.unidade, tenantId);

    return NextResponse.json({
      ...validated.data,
      matchedUnidadeId: match?.unidadeId ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível ler a etiqueta. Tente novamente ou preencha manualmente." },
      { status: 422 }
    );
  }
}
