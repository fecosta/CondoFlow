import { CondominioForm } from "@/components/forms/condominio-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo Condomínio — GCR" };

export default function NewCondominioPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Novo Condomínio</h1>
      <CondominioForm />
    </div>
  );
}
