"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Action = "EM_ANDAMENTO" | "RESOLVIDA" | "FECHADA" | "REABRIR";

interface OcorrenciaActionsProps {
  ocorrenciaId: string;
  currentStatus: string;
}

export function OcorrenciaActions({ ocorrenciaId, currentStatus }: OcorrenciaActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<Action | null>(null);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState("");

  async function handleAction(action: Action, extra?: { resolution?: string }) {
    setLoading(action);
    try {
      const res = await fetch(`/api/ocorrencias/${ocorrenciaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Erro ao atualizar ocorrência.");
        return;
      }
      toast.success("Ocorrência atualizada!");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  const isLoading = loading !== null;

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === "ABERTA" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isLoading}
          onClick={() => handleAction("EM_ANDAMENTO")}
        >
          {loading === "EM_ANDAMENTO" ? "Atualizando..." : "Iniciar Atendimento"}
        </Button>
      )}

      {(currentStatus === "ABERTA" || currentStatus === "EM_ANDAMENTO") && (
        <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={isLoading}>
              Marcar como Resolvida
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolver Ocorrência</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label>Resolução (opcional)</Label>
                <Textarea
                  placeholder="Descreva como o problema foi resolvido..."
                  rows={3}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  disabled={isLoading}
                  onClick={async () => {
                    await handleAction("RESOLVIDA", { resolution });
                    setResolveOpen(false);
                    setResolution("");
                  }}
                >
                  {loading === "RESOLVIDA" ? "Salvando..." : "Confirmar"}
                </Button>
                <Button variant="outline" onClick={() => setResolveOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {currentStatus === "RESOLVIDA" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isLoading}
          onClick={() => handleAction("FECHADA")}
        >
          {loading === "FECHADA" ? "Fechando..." : "Fechar"}
        </Button>
      )}

      {(currentStatus === "RESOLVIDA" || currentStatus === "FECHADA") && (
        <Button
          size="sm"
          variant="outline"
          disabled={isLoading}
          onClick={() => handleAction("REABRIR")}
        >
          {loading === "REABRIR" ? "Reabrindo..." : "Reabrir"}
        </Button>
      )}
    </div>
  );
}
