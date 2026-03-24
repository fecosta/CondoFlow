"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";

interface Props {
  visitanteId: string;
  hasEntry: boolean;
  hasExit: boolean;
}

export function VisitanteEntryButtons({ visitanteId, hasEntry, hasExit }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function act(action: "ENTRADA" | "SAIDA") {
    setLoading(true);
    const res = await fetch(`/api/visitantes/${visitanteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(false);

    if (res.ok) {
      toast.success(action === "ENTRADA" ? "Entrada registrada." : "Saída registrada.");
      router.refresh();
    } else {
      toast.error("Erro ao registrar.");
    }
  }

  if (hasExit) return null;

  return (
    <div className="flex gap-1">
      {!hasEntry && (
        <Button size="sm" variant="outline" onClick={() => act("ENTRADA")} disabled={loading}
          className="text-green-600 border-green-200">
          <LogIn className="h-3 w-3 mr-1" /> Entrada
        </Button>
      )}
      {hasEntry && !hasExit && (
        <Button size="sm" variant="outline" onClick={() => act("SAIDA")} disabled={loading}
          className="text-gray-600">
          <LogOut className="h-3 w-3 mr-1" /> Saída
        </Button>
      )}
    </div>
  );
}
