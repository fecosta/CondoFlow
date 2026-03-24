"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { areaComumSchema, type AreaComumInput } from "@/lib/validations/reserva";
import Link from "next/link";
import { Trash2 } from "lucide-react";

export default function EditAreaComumPage() {
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AreaComumInput>({
    resolver: zodResolver(areaComumSchema),
  });

  useEffect(() => {
    fetch(`/api/areas-comuns/${id}`)
      .then((r) => r.json())
      .then((data) => reset(data))
      .catch(() => toast.error("Erro ao carregar área."));
  }, [id, reset]);

  async function onSubmit(data: AreaComumInput) {
    setLoading(true);
    const res = await fetch(`/api/areas-comuns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (res.ok) toast.success("Área atualizada!");
    else toast.error("Erro ao atualizar área.");
  }

  async function handleDelete() {
    if (!confirm("Desativar esta área comum?")) return;
    setDeleting(true);
    const res = await fetch(`/api/areas-comuns/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      toast.success("Área desativada.");
      router.push("/sindico/areas-comuns");
    } else {
      toast.error("Erro ao desativar área.");
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <p className="text-sm text-gray-500">
          <Link href="/sindico/areas-comuns" className="hover:underline">Áreas Comuns</Link>
          {" / "}Editar
        </p>
        <h1 className="text-2xl font-bold mt-1">Editar Área Comum</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" {...register("description")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="capacity">Capacidade</Label>
                <Input id="capacity" type="number" min={1} {...register("capacity", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="maxDurationHours">Duração máx. (h)</Label>
                <Input id="maxDurationHours" type="number" min={1} {...register("maxDurationHours", { valueAsNumber: true })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="openTime">Abertura</Label>
                <Input id="openTime" type="time" {...register("openTime")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="closeTime">Fechamento</Label>
                <Input id="closeTime" type="time" {...register("closeTime")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="minAdvanceDays">Antecedência mín. (dias)</Label>
                <Input id="minAdvanceDays" type="number" min={0} {...register("minAdvanceDays", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="maxAdvanceDays">Antecedência máx. (dias)</Label>
                <Input id="maxAdvanceDays" type="number" min={1} {...register("maxAdvanceDays", { valueAsNumber: true })} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input id="requiresApproval" type="checkbox" {...register("requiresApproval")} className="h-4 w-4" />
              <Label htmlFor="requiresApproval">Requer aprovação do síndico</Label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Salvando..." : "Salvar"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/sindico/areas-comuns">Cancelar</Link>
              </Button>
              <Button type="button" variant="outline" onClick={handleDelete} disabled={deleting}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
