"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { loginSchema } from "@/lib/validations/auth";

const ROLE_ROUTES: Record<string, string> = {
  SUPER_ADMIN: "/admin/condominios",
  SINDICO: "/sindico/dashboard",
  PORTEIRO: "/portaria/dashboard",
  MORADOR: "/morador/dashboard",
};

const PILLS = [
  "Comunicados",
  "Encomendas",
  "Reservas",
  "Chamados",
  "Portaria",
  "Financeiro",
];

const STATS = [
  { value: "500+", label: "Condomínios" },
  { value: "38k", label: "Moradores" },
  { value: "99.9%", label: "Uptime" },
];

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function CondoFlowLogo({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill="white" fillOpacity="0.15" />
        <path
          d="M16 6L6 12v14h8v-8h4v8h8V12L16 6z"
          fill="white"
          fillOpacity="0.9"
        />
        <rect x="13" y="18" width="6" height="8" rx="1" fill="white" fillOpacity="0.4" />
      </svg>
      <span className="text-white font-extrabold text-xl tracking-tight">
        CondoFlow
      </span>
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsLoading(true);

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      setError("E-mail ou senha inválidos. Tente novamente.");
      setIsLoading(false);
      return;
    }

    const session = await getSession();
    const role = session?.user?.role as string | undefined;
    router.push(ROLE_ROUTES[role ?? ""] ?? "/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel (brand) ── */}
      <div
        className="hidden md:flex w-[44%] relative flex-col justify-between p-10 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #162033 50%, #1e3a8a 100%)",
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M0 0h1v40H0zm39 0h1v40h-1zM0 0v1h40V0zm0 39v1h40v-1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Orb — top right */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)",
          }}
        />

        {/* Orb — bottom left */}
        <div
          className="absolute -bottom-32 -left-32 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 65%)",
          }}
        />

        {/* Top zone: Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2.5 w-fit">
          <CondoFlowLogo className="flex items-center gap-2.5" />
        </Link>

        {/* Middle zone: Headline + pills */}
        <div className="relative z-10 flex flex-col">
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Menos caos,
            <br />
            mais controle.
          </h2>
          <p className="mt-4 text-[15px] text-white/45 max-w-[340px] leading-relaxed">
            Gerencie comunicados, encomendas, reservas e chamados do seu
            condomínio em um painel simples e intuitivo.
          </p>
          <div className="flex flex-wrap gap-2 mt-7">
            {PILLS.map((pill) => (
              <span
                key={pill}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.07] text-white/[0.55] border border-white/[0.08]"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom zone: Stats */}
        <div className="relative z-10 flex gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <span className="text-2xl font-extrabold text-white font-mono tracking-tight">
                {stat.value}
              </span>
              <span className="text-[11px] text-white/35 font-medium mt-0.5">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel (form) ── */}
      <div className="flex-1 relative flex items-center justify-center bg-white px-6 py-12">
        {/* Decorative orb — top right corner */}
        <div
          className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(59,130,246,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="relative w-full max-w-[400px]">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-400 text-[13px] font-medium mb-10 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar para o site
          </Link>

          {/* Mobile logo — visible only when left panel is hidden */}
          <div className="flex md:hidden items-center gap-2.5 mb-8">
            <svg
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect width="32" height="32" rx="8" fill="#1F6FEB" />
              <path
                d="M16 6L6 12v14h8v-8h4v8h8V12L16 6z"
                fill="white"
                fillOpacity="0.9"
              />
              <rect x="13" y="18" width="6" height="8" rx="1" fill="white" fillOpacity="0.4" />
            </svg>
            <span className="text-slate-900 font-extrabold text-xl tracking-tight">
              CondoFlow
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-900">
            Entrar
          </h1>
          <p className="text-sm text-slate-500 mb-9 mt-1">
            Acesse o painel de gestão do seu condomínio.
          </p>

          {/* Error alert */}
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2.5 bg-red-500/[0.03] border border-red-500/[0.12] rounded-[10px] p-3 mb-5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" aria-hidden="true" />
              <span id="login-error" className="text-[13px] text-red-500 font-medium">
                {error}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-[13px] font-semibold text-slate-700 mb-1.5"
              >
                E-mail
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby={error ? "login-error" : undefined}
                  className="w-full h-11 pl-10 pr-4 rounded-[10px] border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all font-sans"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-3">
              <label
                htmlFor="password"
                className="block text-[13px] font-semibold text-slate-700 mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby={error ? "login-error" : undefined}
                  className="w-full h-11 pl-10 pr-11 rounded-[10px] border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-right mb-7">
              <Link
                href="/forgot-password"
                className="text-[13px] font-medium text-blue-500 hover:text-blue-600 transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full h-11 rounded-[10px] bg-blue-500 hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-all shadow-[0_4px_16px_rgba(31,111,235,0.25)] hover:shadow-[0_6px_20px_rgba(31,111,235,0.35)]"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
