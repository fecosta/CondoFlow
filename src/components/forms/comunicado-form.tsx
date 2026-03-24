"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { comunicadoSchema, type ComunicadoInput } from "@/lib/validations/comunicado";

interface ComunicadoFormProps {
  comunicadoId?: string;
  defaultValues?: Partial<ComunicadoInput>;
}

export function ComunicadoForm({ comunicadoId, defaultValues }: ComunicadoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!comunicadoId;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ComunicadoInput>({
    resolver: zodResolver(comunicadoSchema),
    defaultValues,
  });

  async function onSubmit(data: ComunicadoInput) {
    setLoading(true);
    const url = isEdit ? `/api/comunicados/${comunicadoId}` : "/api/comunicados";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);

    if (res.ok) {
      toast.success(isEdit ? "Comunicado atualizado!" : "Comunicado publicado!");
      router.push("/sindico/comunicados");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string };
      toast.error(body.error ?? "Erro ao salvar comunicado.");
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">Título</Label>
            <Input id="title" placeholder="Título do comunicado" {...register("title")} />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              placeholder="Escreva o comunicado aqui..."
              rows={8}
              {...register("content")}
            />
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPinned"
              {...register("isPinned")}
              className="rounded"
            />
            <Label htmlFor="isPinned">Fixar comunicado</Label>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Publicar"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
