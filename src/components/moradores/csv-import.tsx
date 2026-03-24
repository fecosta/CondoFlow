"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle, XCircle } from "lucide-react";

interface CsvRow {
  name: string;
  email?: string;
  phone?: string;
  bloco: string;
  unidade: string;
  vinculo: string;
}

interface ImportResult {
  row: CsvRow;
  success: boolean;
  error?: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  // skip header
  return lines
    .slice(1)
    .map((line) => {
      const parts = line.split(";").map((p) => p.trim().replace(/^"|"$/g, ""));
      return {
        name: parts[0] ?? "",
        email: parts[1] || undefined,
        phone: parts[2] || undefined,
        bloco: parts[3] ?? "",
        unidade: parts[4] ?? "",
        vinculo: (parts[5] ?? "PROPRIETARIO").toUpperCase(),
      };
    })
    .filter((r) => r.name && r.bloco && r.unidade);
}

export function CsvImportMoradores() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCsv(text);
      setRows(parsed);
      setResults([]);
      setDone(false);
    };
    reader.readAsText(file, "utf-8");
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    const importResults: ImportResult[] = [];

    for (const row of rows) {
      // First find the unidade ID by bloco name + unidade number
      const searchRes = await fetch(
        `/api/moradores/resolve-unidade?bloco=${encodeURIComponent(row.bloco)}&number=${encodeURIComponent(row.unidade)}`
      );
      if (!searchRes.ok) {
        importResults.push({ row, success: false, error: `Unidade ${row.bloco}/${row.unidade} não encontrada` });
        continue;
      }
      const { unidadeId } = (await searchRes.json()) as { unidadeId: string };

      const res = await fetch("/api/moradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: row.name,
          email: row.email ?? undefined,
          phone: row.phone ?? undefined,
          unidadeId,
          vinculo: row.vinculo,
        }),
      });

      if (res.ok) {
        importResults.push({ row, success: true });
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string };
        importResults.push({ row, success: false, error: body.error ?? "Erro" });
      }
    }

    setResults(importResults);
    setImporting(false);
    setDone(true);

    const successCount = importResults.filter((r) => r.success).length;
    if (successCount > 0) {
      toast.success(`${successCount} moradores importados com sucesso!`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h2 className="font-semibold">Formato do arquivo CSV</h2>
          <p className="text-sm text-gray-500">
            O arquivo deve ser separado por ponto e vírgula (;) com a seguinte ordem de colunas:
          </p>
          <div className="bg-gray-50 rounded p-3 font-mono text-xs overflow-x-auto">
            nome;email;telefone;bloco;unidade;vinculo
            <br />
            João Silva;joao@email.com;(11)99999-9999;Bloco A;101;PROPRIETARIO
            <br />
            Maria Souza;;(11)88888-8888;Bloco B;202;INQUILINO
          </div>
          <p className="text-xs text-gray-400">
            Colunas obrigatórias: nome, bloco, unidade. Vínculos aceitos: PROPRIETARIO, INQUILINO, DEPENDENTE
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-3">Clique para selecionar o arquivo CSV</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFile}
              className="hidden"
              id="csv-file"
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Selecionar arquivo
            </Button>
          </div>

          {rows.length > 0 && !done && (
            <div className="space-y-3">
              <p className="text-sm font-medium">{rows.length} moradores encontrados na prévia:</p>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {rows.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-gray-500">{r.bloco} — {r.unidade}</span>
                    <Badge variant="outline" className="text-xs">{r.vinculo}</Badge>
                  </div>
                ))}
              </div>
              <Button onClick={handleImport} disabled={importing} className="w-full">
                {importing ? "Importando..." : `Importar ${rows.length} moradores`}
              </Button>
            </div>
          )}

          {done && results.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Resultado da importação:</p>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 text-xs p-2 rounded ${r.success ? "bg-green-50" : "bg-red-50"}`}
                  >
                    {r.success ? (
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                    )}
                    <span className="font-medium">{r.row.name}</span>
                    {r.error && <span className="text-red-500">— {r.error}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
