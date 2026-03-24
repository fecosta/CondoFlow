"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { visitanteSchema, type VisitanteInput } from "@/lib/validations/visitante";
import Link from "next/link";

interface Unidade {
  id: string;
  number: string;
  bloco: { name: string };
}

export function NewVisitanteForm({ unidades }: { unidades: Unidade[] }) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"PONTUAL" | "RECORRENTE">("PONTUAL");
  const router = useRouter();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<VisitanteInput>({
    resolver: zodResolver(visitanteSchema),
    defaultValues: { type: "PONTUAL" },
  });

  async function onSubmit(data: VisitanteInput) {
    setLoading(true);
    const res = await fetch("/api/visitantes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);

    if (res.ok) {
      toast.success("Visitante pré-cadastrado!");
      router.push("/morador/visitantes");
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Erro ao cadastrar visitante.");
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Dados do Visitante</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="document">Documento (CPF/RG)</Label>
            <Input id="document" placeholder="Opcional" {...register("document")} />
          </div>

          <div className="space-y-1">
            <Label>Unidade *</Label>
            <Select onValueChange={(v) => setValue("unidadeId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {unidades.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.bloco.name} — Unidade {u.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unidadeId && <p className="text-sm text-red-500">{errors.unidadeId.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Tipo de Visita *</Label>
            <Select
              defaultValue="PONTUAL"
              onValueChange={(v) => {
                const t = v as "PONTUAL" | "RECORRENTE";
                setType(t);
                setValue("type", t);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PONTUAL">Pontual (data específica)</SelectItem>
                <SelectItem value="RECORRENTE">Recorrente (período)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "PONTUAL" ? (
            <div className="space-y-1">
              <Label htmlFor="expectedDate">Data Esperada</Label>
              <Input id="expectedDate" type="date" {...register("expectedDate")} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="startDate">Data Início</Label>
                <Input id="startDate" type="date" {...register("startDate")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endDate">Data Fim</Label>
                <Input id="endDate" type="date" {...register("endDate")} />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Pré-cadastrar"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/morador/visitantes">Cancelar</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
