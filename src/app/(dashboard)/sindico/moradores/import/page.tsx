import { CsvImportMoradores } from "@/components/moradores/csv-import";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Importar Moradores — GCR" };

export default function ImportMoradoresPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-gray-500">
          <Link href="/sindico/moradores" className="hover:underline">Moradores</Link>
          {" / "}Importar CSV
        </p>
        <h1 className="text-2xl font-bold mt-1">Importar Moradores via CSV</h1>
      </div>
      <CsvImportMoradores />
    </div>
  );
}
