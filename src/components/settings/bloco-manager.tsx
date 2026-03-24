"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Bloco {
  id: string;
  name: string;
  _count: { unidades: number };
}

const schema = z.object({ name: z.string().min(1, "Nome obrigatório") });

export function BlocoManager({ condominioId, blocos }: { condominioId: string; blocos: Bloco[] }) {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ name: string }>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: { name: string }) {
    setLoading(true);
    const res = await fetch(`/api/condominios/${condominioId}/blocos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);

    if (res.ok) {
      toast.success("Bloco criado!");
      setShowForm(false);
      reset();
      router.refresh();
    } else {
      toast.error("Erro ao criar bloco.");
    }
  }

  return (
    <div className="space-y-3">
      {blocos.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum bloco cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {blocos.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">{b.name}</span>
              <span className="text-xs text-gray-500">{b._count.unidades} unidades</span>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="blocoName">Nome do bloco</Label>
            <Input id="blocoName" placeholder="Ex: Bloco A" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Salvando..." : "Adicionar"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => { setShowForm(false); reset(); }}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          + Adicionar Bloco
        </Button>
      )}
    </div>
  );
}
