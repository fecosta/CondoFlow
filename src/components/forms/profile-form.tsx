"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/auth";

const nameSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

interface ProfileFormProps {
  userId: string;
  name: string;
  email: string;
}

export function ProfileForm({ userId, name, email }: ProfileFormProps) {
  const [loadingName, setLoadingName] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const nameForm = useForm({ resolver: zodResolver(nameSchema), defaultValues: { name } });
  const pwForm = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  async function onSaveName(data: { name: string }) {
    setLoadingName(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoadingName(false);
    if (res.ok) toast.success("Nome atualizado com sucesso!");
    else toast.error("Erro ao atualizar nome.");
  }

  async function onChangePassword(data: ChangePasswordInput) {
    setLoadingPassword(true);
    const res = await fetch(`/api/users/${userId}/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoadingPassword(false);
    if (res.ok) {
      toast.success("Senha alterada com sucesso!");
      pwForm.reset();
    } else {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Erro ao alterar senha.");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Informações Pessoais</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={nameForm.handleSubmit(onSaveName)} className="space-y-4">
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input value={email} disabled />
            </div>
            <div className="space-y-1">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...nameForm.register("name")} />
              {nameForm.formState.errors.name && (
                <p className="text-sm text-red-500">{nameForm.formState.errors.name.message}</p>
              )}
            </div>
            <Button type="submit" disabled={loadingName}>
              {loadingName ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Alterar Senha</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={pwForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="currentPassword">Senha atual</Label>
              <Input id="currentPassword" type="password" {...pwForm.register("currentPassword")} />
              {pwForm.formState.errors.currentPassword && (
                <p className="text-sm text-red-500">{pwForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input id="newPassword" type="password" {...pwForm.register("newPassword")} />
              {pwForm.formState.errors.newPassword && (
                <p className="text-sm text-red-500">{pwForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input id="confirmPassword" type="password" {...pwForm.register("confirmPassword")} />
              {pwForm.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">{pwForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" disabled={loadingPassword}>
              {loadingPassword ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
