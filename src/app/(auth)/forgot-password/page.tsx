import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Esqueci minha senha — GCR" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
