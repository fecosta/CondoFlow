"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleMarkAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/notificacoes", { method: "PATCH" });
      if (!res.ok) {
        toast.error("Erro ao marcar notificações.");
        return;
      }
      toast.success("Todas as notificações marcadas como lidas.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={loading} onClick={handleMarkAll}>
      {loading ? "Marcando..." : "Marcar todas como lidas"}
    </Button>
  );
}
