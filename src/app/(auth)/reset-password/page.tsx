import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Redefinir senha — GCR" };

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return <ResetPasswordForm token={searchParams.token} />;
}
