"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { condominioSchema, type CondominioInput } from "@/lib/validations/condominio";

interface CondominioFormProps {
  condominioId?: string;
  defaultValues?: Partial<CondominioInput>;
}

export function CondominioForm({ condominioId, defaultValues }: CondominioFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!condominioId;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CondominioInput>({ resolver: zodResolver(condominioSchema), defaultValues });

  async function onSubmit(data: CondominioInput) {
    setLoading(true);
    const url = isEdit ? `/api/condominios/${condominioId}` : "/api/condominios";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);

    if (res.ok) {
      const cond = (await res.json()) as { id: string };
      toast.success(isEdit ? "Condomínio atualizado!" : "Condomínio criado!");
      router.push(`/admin/condominios/${cond.id}`);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string };
      toast.error(body.error ?? "Erro ao salvar condomínio.");
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Nome do condomínio *</Label>
            <Input id="name" placeholder="Ex: Residencial das Flores" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" placeholder="00.000.000/0000-00" {...register("cnpj")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="zipCode">CEP</Label>
              <Input id="zipCode" placeholder="00000-000" {...register("zipCode")} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" placeholder="Rua, número, complemento" {...register("address")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" {...register("city")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="state">Estado</Label>
              <Input id="state" maxLength={2} placeholder="SP" {...register("state")} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar Condomínio"}
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
