import { ComunicadoForm } from "@/components/forms/comunicado-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo Comunicado — GCR" };

export default function NewComunicadoPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Novo Comunicado</h1>
      <ComunicadoForm />
    </div>
  );
}
