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
import { reservaSchema, type ReservaInput } from "@/lib/validations/reserva";
import Link from "next/link";

interface AreaComum {
  id: string;
  name: string;
  openTime: string;
  closeTime: string;
  requiresApproval: boolean;
  capacity: number | null;
}

interface Unidade {
  id: string;
  number: string;
  bloco: { name: string };
}

interface Props {
  areas: AreaComum[];
  unidades: Unidade[];
}

export function NewReservaForm({ areas, unidades }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ReservaInput>({
    resolver: zodResolver(reservaSchema),
  });

  const selectedAreaId = watch("areaComumId");
  const selectedArea = areas.find((a) => a.id === selectedAreaId);

  async function onSubmit(data: ReservaInput) {
    setLoading(true);
    const res = await fetch("/api/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);

    if (res.ok) {
      toast.success("Reserva solicitada!");
      router.push("/morador/reservas");
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Erro ao solicitar reserva.");
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Detalhes da Reserva</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Área Comum *</Label>
            <Select onValueChange={(v) => setValue("areaComumId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a área" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.openTime}–{a.closeTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.areaComumId && <p className="text-sm text-red-500">{errors.areaComumId.message}</p>}
            {selectedArea && (
              <p className="text-xs text-gray-500 mt-1">
                {selectedArea.requiresApproval ? "⏳ Requer aprovação do síndico" : "✅ Aprovação automática"}
                {selectedArea.capacity ? ` · Capacidade: ${selectedArea.capacity} pessoas` : ""}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Unidade *</Label>
            <Select onValueChange={(v) => setValue("unidadeId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione sua unidade" />
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
            <Label htmlFor="date">Data *</Label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="startTime">Início *</Label>
              <Input id="startTime" type="time" {...register("startTime")} />
              {errors.startTime && <p className="text-sm text-red-500">{errors.startTime.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="endTime">Término *</Label>
              <Input id="endTime" type="time" {...register("endTime")} />
              {errors.endTime && <p className="text-sm text-red-500">{errors.endTime.message}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Solicitando..." : "Solicitar Reserva"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/morador/reservas">Cancelar</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
