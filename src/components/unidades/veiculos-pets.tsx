"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Car, PawPrint } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// --- Types ---
interface Veiculo {
  id: string;
  plate: string;
  model: string | null;
  color: string | null;
  parkingSpot: string | null;
}

interface Pet {
  id: string;
  name: string;
  breed: string | null;
  size: string;
  sizeLabel: string;
}

interface Props {
  unidadeId: string;
  veiculos: Veiculo[];
  pets: Pet[];
}

// --- Schemas ---
const veiculoSchema = z.object({
  plate: z.string().min(1, "Placa obrigatória"),
  model: z.string().optional(),
  color: z.string().optional(),
  parkingSpot: z.string().optional(),
});
type VeiculoForm = z.infer<typeof veiculoSchema>;

const petSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  breed: z.string().optional(),
  size: z.enum(["PEQUENO", "MEDIO", "GRANDE"]),
});
type PetForm = z.infer<typeof petSchema>;

// --- Veiculo Dialog ---
function AddVeiculoDialog({ unidadeId }: { unidadeId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VeiculoForm>({
    resolver: zodResolver(veiculoSchema),
  });

  async function onSubmit(data: VeiculoForm) {
    setLoading(true);
    const res = await fetch("/api/veiculos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, unidadeId }),
    });
    setLoading(false);
    if (res.ok) { toast.success("Veículo adicionado."); setOpen(false); reset(); router.refresh(); }
    else { const b = await res.json().catch(() => ({})); toast.error(b.error ?? "Erro."); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar Veículo</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label>Placa *</Label>
            <Input placeholder="ABC-1234" {...register("plate")} />
            {errors.plate && <p className="text-sm text-red-500">{errors.plate.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Modelo</Label><Input placeholder="Ex: Civic" {...register("model")} /></div>
            <div className="space-y-1"><Label>Cor</Label><Input placeholder="Ex: Prata" {...register("color")} /></div>
          </div>
          <div className="space-y-1"><Label>Vaga</Label><Input placeholder="Ex: 12" {...register("parkingSpot")} /></div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">{loading ? "Salvando..." : "Adicionar"}</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Pet Dialog ---
function AddPetDialog({ unidadeId }: { unidadeId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<PetForm>({
    resolver: zodResolver(petSchema),
    defaultValues: { size: "MEDIO" },
  });

  async function onSubmit(data: PetForm) {
    setLoading(true);
    const res = await fetch("/api/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, unidadeId }),
    });
    setLoading(false);
    if (res.ok) { toast.success("Pet adicionado."); setOpen(false); reset(); router.refresh(); }
    else { const b = await res.json().catch(() => ({})); toast.error(b.error ?? "Erro."); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar Pet</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input placeholder="Ex: Rex" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1"><Label>Raça</Label><Input placeholder="Ex: Labrador" {...register("breed")} /></div>
          <div className="space-y-1">
            <Label>Porte</Label>
            <Select defaultValue="MEDIO" onValueChange={(v) => setValue("size", v as PetForm["size"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PEQUENO">Pequeno</SelectItem>
                <SelectItem value="MEDIO">Médio</SelectItem>
                <SelectItem value="GRANDE">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">{loading ? "Salvando..." : "Adicionar"}</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Delete buttons ---
function DeleteVeiculoButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function del() {
    if (!confirm("Remover veículo?")) return;
    setLoading(true);
    const res = await fetch(`/api/veiculos/${id}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) { toast.success("Veículo removido."); router.refresh(); }
    else toast.error("Erro ao remover.");
  }
  return <Button variant="ghost" size="icon" onClick={del} disabled={loading}><Trash2 className="h-3 w-3 text-red-500" /></Button>;
}

function DeletePetButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function del() {
    if (!confirm("Remover pet?")) return;
    setLoading(true);
    const res = await fetch(`/api/pets/${id}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) { toast.success("Pet removido."); router.refresh(); }
    else toast.error("Erro ao remover.");
  }
  return <Button variant="ghost" size="icon" onClick={del} disabled={loading}><Trash2 className="h-3 w-3 text-red-500" /></Button>;
}

// --- Main component ---
export function VeiculosPets({ unidadeId, veiculos, pets }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2"><Car className="h-4 w-4" /> Veículos</span>
            <AddVeiculoDialog unidadeId={unidadeId} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {veiculos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum veículo.</p>
          ) : (
            <div className="space-y-2">
              {veiculos.map((v) => (
                <div key={v.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{v.plate}</p>
                    <p className="text-xs text-gray-500">
                      {[v.model, v.color, v.parkingSpot ? `Vaga ${v.parkingSpot}` : null].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <DeleteVeiculoButton id={v.id} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2"><PawPrint className="h-4 w-4" /> Pets</span>
            <AddPetDialog unidadeId={unidadeId} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pets.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum pet.</p>
          ) : (
            <div className="space-y-2">
              {pets.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.breed ?? "Raça não informada"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">{p.sizeLabel}</Badge>
                    <DeletePetButton id={p.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
