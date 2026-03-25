"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  EM_DIA: "Em Dia",
  PENDENTE: "Pendente",
  INADIMPLENTE: "Inadimplente",
};

interface FinanceiroActionsProps {
  unidadeId: string;
  currentStatus: string;
  currentObs?: string | null;
}

export function FinanceiroActions({ unidadeId, currentStatus, currentObs }: FinanceiroActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [obs, setObs] = useState(currentObs ?? "");
  const [loading, setLoading] = useState(false);
  const [showObs, setShowObs] = useState(false);

  const hasChanges = status !== currentStatus || obs !== (currentObs ?? "");

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/financeiro/${unidadeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusFinanceiro: status, obsFinanceiro: obs }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Erro ao atualizar.");
        return;
      }
      toast.success("Situação financeira atualizada!");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="EM_DIA">Em Dia</SelectItem>
          <SelectItem value="PENDENTE">Pendente</SelectItem>
          <SelectItem value="INADIMPLENTE">Inadimplente</SelectItem>
        </SelectContent>
      </Select>

      {(showObs || obs) && (
        <Textarea
          placeholder="Observações..."
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          rows={2}
          className="text-xs"
        />
      )}

      <div className="flex gap-2">
        {!showObs && !obs && (
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setShowObs(true)}>
            + Observação
          </Button>
        )}
        {hasChanges && (
          <Button size="sm" className="text-xs h-7" disabled={loading} onClick={handleSave}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        )}
      </div>
    </div>
  );
}

export { STATUS_LABELS };
