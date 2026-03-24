"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pin, PinOff } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PinToggle({ id, isPinned }: { id: string; isPinned: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/comunicados/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !isPinned }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
      toast.success(isPinned ? "Comunicado desafixado." : "Comunicado fixado.");
    } else {
      toast.error("Erro ao atualizar comunicado.");
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      disabled={loading}
      title={isPinned ? "Desafixar" : "Fixar"}
    >
      {isPinned ? (
        <PinOff className="h-4 w-4 text-yellow-500" />
      ) : (
        <Pin className="h-4 w-4 text-gray-400" />
      )}
    </Button>
  );
}
