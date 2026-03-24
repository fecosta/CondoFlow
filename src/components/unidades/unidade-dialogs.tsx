"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Bloco {
  id: string;
  name: string;
  condominioId: string;
}

// --- New Unidade ---
const createSchema = z.object({
  number: z.string().min(1, "Número obrigatório"),
  blocoId: z.string().min(1, "Bloco obrigatório"),
  status: z.enum(["OCUPADA", "VAGA", "BLOQUEADA"]),
});
type CreateData = z.infer<typeof createSchema>;

export function NewUnidadeDialog({ blocos, condominioId }: { blocos: Bloco[]; condominioId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<CreateData>({
    resolver: zodResolver(createSchema),
    defaultValues: { status: "VAGA" },
  });

  async function onSubmit(data: CreateData) {
    setLoading(true);
    const res = await fetch(`/api/condominios/${condominioId}/unidades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);

    if (res.ok) {
      toast.success("Unidade criada!");
      setOpen(false);
      reset();
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Erro ao criar unidade.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nova Unidade
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Unidade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="number">Número *</Label>
            <Input id="number" placeholder="Ex: 101" {...register("number")} />
            {errors.number && <p className="text-sm text-red-500">{errors.number.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Bloco *</Label>
            <Select onValueChange={(v) => setValue("blocoId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o bloco" />
              </SelectTrigger>
              <SelectContent>
                {blocos.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.blocoId && <p className="text-sm text-red-500">{errors.blocoId.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select onValueChange={(v) => setValue("status", v as CreateData["status"])} defaultValue="VAGA">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VAGA">Vaga</SelectItem>
                <SelectItem value="OCUPADA">Ocupada</SelectItem>
                <SelectItem value="BLOQUEADA">Bloqueada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Criar"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit Unidade ---
const editSchema = z.object({
  number: z.string().min(1, "Número obrigatório"),
  status: z.enum(["OCUPADA", "VAGA", "BLOQUEADA"]),
});
type EditData = z.infer<typeof editSchema>;

export function EditUnidadeDialog({
  unidadeId,
  currentNumber,
  currentStatus,
}: {
  unidadeId: string;
  currentNumber: string;
  currentStatus: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EditData>({
    resolver: zodResolver(editSchema),
    defaultValues: { number: currentNumber, status: currentStatus as EditData["status"] },
  });

  async function onSubmit(data: EditData) {
    setLoading(true);
    const res = await fetch(`/api/unidades/${unidadeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);

    if (res.ok) {
      toast.success("Unidade atualizada.");
      setOpen(false);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Erro ao atualizar unidade.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Unidade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="edit-number">Número *</Label>
            <Input id="edit-number" {...register("number")} />
            {errors.number && <p className="text-sm text-red-500">{errors.number.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              onValueChange={(v) => setValue("status", v as EditData["status"])}
              defaultValue={currentStatus}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VAGA">Vaga</SelectItem>
                <SelectItem value="OCUPADA">Ocupada</SelectItem>
                <SelectItem value="BLOQUEADA">Bloqueada</SelectItem>
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

// --- Delete Unidade ---
export function DeleteUnidadeButton({ unidadeId, onDeleted }: { unidadeId: string; onDeleted?: () => void }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Excluir esta unidade? Esta ação não pode ser desfeita.")) return;
    setLoading(true);
    const res = await fetch(`/api/unidades/${unidadeId}`, { method: "DELETE" });
    setLoading(false);

    if (res.ok) {
      toast.success("Unidade excluída.");
      if (onDeleted) onDeleted();
      else router.back();
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Erro ao excluir unidade.");
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4 mr-2 text-red-500" />
      Excluir
    </Button>
  );
}
