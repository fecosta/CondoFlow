"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ocorrenciaSchema, OcorrenciaInput } from "@/lib/validations/ocorrencia";

const CATEGORY_LABELS: Record<string, string> = {
  MANUTENCAO: "Manutenção",
  BARULHO: "Barulho",
  SEGURANCA: "Segurança",
  LIMPEZA: "Limpeza",
  AREAS_COMUNS: "Áreas Comuns",
  OUTROS: "Outros",
};

const PRIORITY_LABELS: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

interface NovaOcorrenciaFormProps {
  unidadeId: string;
  unidadeLabel: string;
}

export function NovaOcorrenciaForm({ unidadeId, unidadeLabel }: NovaOcorrenciaFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OcorrenciaInput>({
    resolver: zodResolver(ocorrenciaSchema),
    defaultValues: {
      unidadeId,
      category: "OUTROS",
      priority: "MEDIA",
    },
  });

  const category = watch("category");
  const priority = watch("priority");

  async function onSubmit(data: OcorrenciaInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/ocorrencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? "Erro ao registrar ocorrência.");
        return;
      }
      toast.success("Ocorrência registrada com sucesso!");
      router.push("/morador/ocorrencias");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Nova Ocorrência</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Unidade</Label>
            <Input value={unidadeLabel} disabled />
            <input type="hidden" {...register("unidadeId")} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="title">Título</Label>
            <Input id="title" placeholder="Descreva brevemente o problema" {...register("title")} />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o problema em detalhes..."
              rows={4}
              {...register("description")}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setValue("category", v as OcorrenciaInput["category"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setValue("priority", v as OcorrenciaInput["priority"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priority && <p className="text-sm text-red-500">{errors.priority.message}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Ocorrência"}
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
