"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function RemoveSindicoButton({ assignmentId, name }: { assignmentId: string; name: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRemove() {
    if (!confirm(`Remover ${name} como síndico?`)) return;
    setLoading(true);
    const res = await fetch(`/api/sindicos/${assignmentId}`, { method: "DELETE" });
    setLoading(false);

    if (res.ok) {
      toast.success("Síndico removido.");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Erro ao remover síndico.");
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleRemove} disabled={loading}>
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  );
}
