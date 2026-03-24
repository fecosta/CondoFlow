"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { moradorSchema, type MoradorInput } from "@/lib/validations/condominio";
import { Pencil, Trash2 } from "lucide-react";

interface Unidade {
  id: string;
  number: string;
  bloco: { name: string };
}

interface EditMoradorDialogProps {
  moradorId: string;
  defaultValues: Partial<MoradorInput>;
  unidades: Unidade[];
}

export function EditMoradorDialog({ moradorId, defaultValues, unidades }: EditMoradorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<MoradorInput>({
    resolver: zodResolver(moradorSchema),
    defaultValues,
  });

  async function onSubmit(data: MoradorInput) {
    setLoading(true);
    const res = await fetch(`/api/moradores/${moradorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);

    if (res.ok) {
      toast.success("Morador atualizado.");
      setOpen(false);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Erro ao atualizar morador.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Morador</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="edit-name">Nome *</Label>
            <Input id="edit-name" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-email">E-mail</Label>
            <Input id="edit-email" type="email" {...register("email")} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-phone">Telefone</Label>
            <Input id="edit-phone" {...register("phone")} />
          </div>
          <div className="space-y-1">
            <Label>Unidade *</Label>
            <Select
              onValueChange={(v) => setValue("unidadeId", v)}
              defaultValue={defaultValues.unidadeId}
            >
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
            <Label>Vínculo</Label>
            <Select
              onValueChange={(v) => setValue("vinculo", v as MoradorInput["vinculo"])}
              defaultValue={defaultValues.vinculo ?? "PROPRIETARIO"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROPRIETARIO">Proprietário</SelectItem>
                <SelectItem value="INQUILINO">Inquilino</SelectItem>
                <SelectItem value="DEPENDENTE">Dependente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Salvar"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteMoradorButton({ moradorId, name }: { moradorId: string; name: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Remover ${name}?`)) return;
    setLoading(true);
    const res = await fetch(`/api/moradores/${moradorId}`, { method: "DELETE" });
    setLoading(false);

    if (res.ok) {
      toast.success("Morador removido.");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Erro ao remover morador.");
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  );
}
