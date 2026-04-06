"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Unidade {
  id: string;
  number: string;
  bloco: { name: string };
}

interface UnidadeSelectorProps {
  unidades: Unidade[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  hasError?: boolean;
}

export function UnidadeSelector({
  unidades,
  value,
  onChange,
  placeholder = "Selecione a unidade",
  hasError,
}: UnidadeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = unidades.find((u) => u.id === value);

  const grouped = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = q
      ? unidades.filter(
          (u) =>
            u.number.toLowerCase().includes(q) ||
            u.bloco.name.toLowerCase().includes(q)
        )
      : unidades;

    return filtered.reduce<Record<string, Unidade[]>>((acc, u) => {
      const key = u.bloco.name;
      if (!acc[key]) acc[key] = [];
      acc[key].push(u);
      return acc;
    }, {});
  }, [unidades, search]);

  function handleSelect(u: Unidade) {
    onChange(u.id);
    setOpen(false);
    setSearch("");
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full justify-between font-normal h-10",
          !selected && "text-muted-foreground",
          hasError && "border-destructive"
        )}
      >
        <span className="truncate">
          {selected ? `${selected.bloco.name} — Unidade ${selected.number}` : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(""); }}>
        <DialogContent className="max-w-sm p-0 gap-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Selecionar Unidade</DialogTitle>
          </DialogHeader>

          <div className="p-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar unidade ou bloco..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-72 pb-2">
            {Object.keys(grouped).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhuma unidade encontrada.
              </p>
            ) : (
              Object.entries(grouped).map(([blocoName, units]) => (
                <div key={blocoName}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2">
                    {blocoName}
                  </p>
                  {units.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelect(u)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-accent transition-colors",
                        u.id === value && "bg-accent text-accent-foreground font-medium"
                      )}
                    >
                      <span>Unidade {u.number}</span>
                      {u.id === value && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
