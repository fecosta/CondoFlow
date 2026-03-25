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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Pencil, Trash2 } from "lucide-react";

// --- New Porteiro ---
const createSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  phone: z.string().optional(),
  turno: z.string().optional(),
});
type CreateData = z.infer<typeof createSchema>;

export function NewPorteiroDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CreateData>({
    resolver: zodResolver(createSchema),
  });

  const turno = watch("turno");

  async function onSubmit(data: CreateData) {
    setLoading(true);
    const res = await fetch("/api/porteiros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);

    if (res.ok) {
      toast.success("Porteiro cadastrado com sucesso!");
      setOpen(false);
      reset();
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Erro ao cadastrar porteiro.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" /> Novo Porteiro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar Porteiro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">E-mail *</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Senha *</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(00) 00000-0000" {...register("phone")} />
            </div>
            <div className="space-y-1">
              <Label>Turno</Label>
              <Select value={turno ?? ""} onValueChange={(v) => setValue("turno", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANHA">Manhã</SelectItem>
                  <SelectItem value="TARDE">Tarde</SelectItem>
                  <SelectItem value="NOITE">Noite</SelectItem>
                  <SelectItem value="INTEGRAL">Integral</SelectItem>
                  <SelectItem value="12x36">12x36</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Cadastrar"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit Porteiro ---
const editSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
  turno: z.string().optional(),
});
type EditData = z.infer<typeof editSchema>;

interface EditPorteiroProps {
  assignmentId: string;
  currentName: string;
  currentPhone?: string | null;
  currentTurno?: string | null;
}

export function EditPorteiroDialog({ assignmentId, currentName, currentPhone, currentTurno }: EditPorteiroProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EditData>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: currentName, phone: currentPhone ?? "", turno: currentTurno ?? "" },
  });

  const turno = watch("turno");

  async function onSubmit(data: EditData) {
    setLoading(true);
    const res = await fetch(`/api/porteiros/${assignmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);

    if (res.ok) {
      toast.success("Porteiro atualizado.");
      setOpen(false);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Erro ao atualizar porteiro.");
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
          <DialogTitle>Editar Porteiro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="edit-name">Nome *</Label>
            <Input id="edit-name" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input id="edit-phone" placeholder="(00) 00000-0000" {...register("phone")} />
            </div>
            <div className="space-y-1">
              <Label>Turno</Label>
              <Select value={turno ?? ""} onValueChange={(v) => setValue("turno", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANHA">Manhã</SelectItem>
                  <SelectItem value="TARDE">Tarde</SelectItem>
                  <SelectItem value="NOITE">Noite</SelectItem>
                  <SelectItem value="INTEGRAL">Integral</SelectItem>
                  <SelectItem value="12x36">12x36</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

// --- Delete Porteiro ---
export function DeletePorteiroButton({ assignmentId, name }: { assignmentId: string; name: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Remover ${name} da portaria?`)) return;
    setLoading(true);
    const res = await fetch(`/api/porteiros/${assignmentId}`, { method: "DELETE" });
    setLoading(false);

    if (res.ok) {
      toast.success("Porteiro removido.");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Erro ao remover porteiro.");
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  );
}
