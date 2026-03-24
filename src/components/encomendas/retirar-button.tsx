"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  registrarRetiradaSchema,
  type RegistrarRetiradaInput,
} from "@/lib/validations/encomenda";
import { CheckCircle } from "lucide-react";

export function RetirarButton({ encomendaId }: { encomendaId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegistrarRetiradaInput>({
    resolver: zodResolver(registrarRetiradaSchema),
  });

  async function onSubmit(data: RegistrarRetiradaInput) {
    setLoading(true);
    const res = await fetch(`/api/encomendas/${encomendaId}/retirar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);

    if (res.ok) {
      toast.success("Retirada registrada!");
      setOpen(false);
      reset();
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string };
      toast.error(body.error ?? "Erro ao registrar retirada.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CheckCircle className="h-4 w-4 mr-1" /> Registrar Retirada
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Retirada</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="pickedUpName">Nome de quem retirou</Label>
            <Input
              id="pickedUpName"
              placeholder="Nome completo"
              {...register("pickedUpName")}
            />
            {errors.pickedUpName && (
              <p className="text-sm text-red-500">
                {errors.pickedUpName.message}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Confirmar Retirada"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
