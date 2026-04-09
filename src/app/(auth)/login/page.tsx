import { LoginForm } from "./login-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Entrar — CondoFlow" };

export default function LoginPage() {
  return <LoginForm />;
}
