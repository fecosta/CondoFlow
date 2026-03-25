"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Preference {
  type: string;
  label: string;
  email: boolean;
  digest: boolean;
}

interface PreferenciasFormProps {
  preferences: Preference[];
}

export function PreferenciasForm({ preferences: initial }: PreferenciasFormProps) {
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState<string | null>(null);

  async function handleToggle(type: string, field: "email" | "digest", value: boolean) {
    setSaving(type);
    const pref = prefs.find((p) => p.type === type)!;
    const updated = { ...pref, [field]: value };

    try {
      const res = await fetch("/api/notificacoes/preferencias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, email: updated.email, digest: updated.digest }),
      });
      if (!res.ok) {
        toast.error("Erro ao salvar preferência.");
        return;
      }
      setPrefs((prev) => prev.map((p) => (p.type === type ? updated : p)));
      toast.success("Preferência salva!");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="bg-white border rounded-lg divide-y">
      {prefs.map((pref) => (
        <div key={pref.type} className="p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium text-gray-800">{pref.label}</span>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={pref.email}
                  disabled={saving === pref.type}
                  onChange={(e) => handleToggle(pref.type, "email", e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-600">E-mail</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={pref.digest}
                  disabled={saving === pref.type}
                  onChange={(e) => handleToggle(pref.type, "digest", e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-600">Resumo Diário</span>
              </label>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}