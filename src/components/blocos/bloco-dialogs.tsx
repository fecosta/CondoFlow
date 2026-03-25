"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

// --- New Bloco ---
export function NewBlocoDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch("/api/blocos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Bloco criado!");
      setOpen(false);
      setName("");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Erro ao criar bloco.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Novo Bloco</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Bloco / Torre</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="bloco-name">Nome *</Label>
            <Input id="bloco-name" placeholder="Ex: Bloco A, Torre 1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading || !name.trim()} className="flex-1">
              {loading ? "Criando..." : "Criar"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit Bloco ---
export function EditBlocoDialog({ blocoId, currentName }: { blocoId: string; currentName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(currentName);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/blocos/${blocoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Bloco atualizado!");
      setOpen(false);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Erro ao atualizar bloco.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Bloco</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="edit-bloco-name">Nome *</Label>
            <Input id="edit-bloco-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading || !name.trim()} className="flex-1">
              {loading ? "Salvando..." : "Salvar"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Delete Bloco ---
export function DeleteBlocoButton({ blocoId, name }: { blocoId: string; name: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Remover o bloco "${name}"? Esta ação não pode ser desfeita.`)) return;
    setLoading(true);
    const res = await fetch(`/api/blocos/${blocoId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      toast.success("Bloco removido.");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Erro ao remover bloco.");
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={loading}>
      <Trash2 className="h-4 w-4 text-red-500" />
    </Button>
  );
}
