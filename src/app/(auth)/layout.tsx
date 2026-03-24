export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GCR</h1>
          <p className="text-sm text-gray-500 mt-1">Gestão de Condomínios</p>
        </div>
        {children}
      </div>
    </div>
  );
}
