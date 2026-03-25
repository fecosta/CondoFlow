"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ComentarioFormProps {
  ocorrenciaId: string;
  isSindico: boolean;
}

export function ComentarioForm({ ocorrenciaId, isSindico }: ComentarioFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/ocorrencias/${ocorrenciaId}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), isInternal }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Erro ao enviar comentário.");
        return;
      }
      toast.success("Comentário enviado!");
      setContent("");
      setIsInternal(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="comentario">Comentário</Label>
        <Textarea
          id="comentario"
          placeholder="Escreva seu comentário..."
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      {isSindico && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            className="rounded"
          />
          <span className="text-gray-600">Comentário Interno (visível somente ao síndico)</span>
        </label>
      )}
      <Button type="submit" size="sm" disabled={loading || !content.trim()}>
        {loading ? "Enviando..." : "Enviar Comentário"}
      </Button>
    </form>
  );
}
