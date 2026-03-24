"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Check, X, Ban } from "lucide-react";

interface Props {
  reservaId: string;
  cancelOnly?: boolean;
}

export function ReservaActions({ reservaId, cancelOnly }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function act(action: "APROVAR" | "REJEITAR" | "CANCELAR", reason?: string) {
    setLoading(action);
    const res = await fetch(`/api/reservas/${reservaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    setLoading(null);

    if (res.ok) {
      const labels: Record<string, string> = { APROVAR: "Reserva aprovada.", REJEITAR: "Reserva rejeitada.", CANCELAR: "Reserva cancelada." };
      toast.success(labels[action]);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Erro ao processar ação.");
    }
  }

  if (cancelOnly) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => act("CANCELAR")}
        disabled={loading !== null}
        className="text-red-600 hover:text-red-700"
      >
        <Ban className="h-4 w-4 mr-1" /> Cancelar
      </Button>
    );
  }

  return (
    <div className="flex gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => act("APROVAR")}
        disabled={loading !== null}
        className="text-green-600 border-green-200 hover:bg-green-50"
      >
        <Check className="h-4 w-4 mr-1" /> Aprovar
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => act("REJEITAR")}
        disabled={loading !== null}
        className="text-red-600 border-red-200 hover:bg-red-50"
      >
        <X className="h-4 w-4 mr-1" /> Rejeitar
      </Button>
    </div>
  );
}
