import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/forms/profile-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Meu Perfil — GCR" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>
      <ProfileForm userId={session.user.id} name={session.user.name ?? ""} email={session.user.email ?? ""} />
    </div>
  );
}
