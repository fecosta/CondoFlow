"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "./input";

interface SearchInputProps {
  placeholder?: string;
  defaultValue?: string;
  paramName?: string;
}

export function SearchInput({ placeholder = "Buscar...", defaultValue = "", paramName = "q" }: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [debouncedValue] = useDebounce(value, 400);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedValue) {
      params.set(paramName, debouncedValue);
    } else {
      params.delete(paramName);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
