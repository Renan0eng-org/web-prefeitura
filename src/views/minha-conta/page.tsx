"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAlert } from "@/hooks/use-alert";
import { useAuth } from "@/hooks/use-auth";
import api from "@/services/api";
import { Eye, EyeOff, Loader2, Save, Shield, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const profileSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres."),
  email: z.string().email("Formato de e-mail inválido."),
  cpf: z.string().optional(),
  phone: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  crm: z.string().optional().nullable(),
  especialidade: z.string().optional().nullable(),
  cargaHoraria: z.string().optional().nullable(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória."),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres."),
  confirmPassword: z.string().min(6, "Confirmação deve ter no mínimo 6 caracteres."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export default function MyAccountPage() {
  const { user, loading } = useAuth();
  const isMedico = (user as any)?.type === "MEDICO";
  const { setAlert } = useAlert();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      cpf: "",
      phone: "",
      cep: "",
      crm: "",
      especialidade: "",
      cargaHoraria: "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        email: user.email || "",
        cpf: user.cpf || "",
        phone: user.phone || "",
        cep: user.cep || "",
        crm: (user as any).crm || "",
        especialidade: (user as any).especialidade || "",
        cargaHoraria: (user as any).cargaHoraria ? String((user as any).cargaHoraria) : "",
      });
    }
  }, [user]);

  const onProfileSubmit = async (data: ProfileForm) => {
    try {
      setSavingProfile(true);
      const payload: any = {
        name: data.name, email: data.email, cpf: data.cpf, phone: data.phone, cep: data.cep,
      };
      if (isMedico) {
        payload.crm = data.crm || undefined;
        payload.especialidade = data.especialidade || undefined;
        payload.cargaHoraria = data.cargaHoraria ? Number(data.cargaHoraria) : undefined;
      }
      await api.patch("/auth/profile", payload);
      setAlert("Dados atualizados com sucesso!", "success");
    } catch (err: any) {
      setAlert(err.response?.data?.message || "Erro ao atualizar dados.", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    try {
      setSavingPassword(true);
      await api.post("/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setAlert("Senha alterada com sucesso!", "success");
      passwordForm.reset();
    } catch (err: any) {
      setAlert(err.response?.data?.message || "Erro ao alterar senha.", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Minha Conta</h1>
        <p className="text-sm text-muted-foreground">Gerencie seus dados pessoais e senha.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="password">Alterar Senha</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>Atualize suas informações de contato.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input id="name" {...profileForm.register("name")} />
                    {profileForm.formState.errors.name && (
                      <p className="text-sm text-red-500">{profileForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" {...profileForm.register("email")} />
                    {profileForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{profileForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" {...profileForm.register("cpf")} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" {...profileForm.register("phone")} placeholder="(00) 00000-0000" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input id="cep" {...profileForm.register("cep")} placeholder="00000-000" />
                  </div>
                </div>

                {isMedico && (
                  <>
                    <Separator />
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">Dados de Médico</h3>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="crm">CRM</Label>
                          <Input id="crm" {...profileForm.register("crm")} placeholder="PR-00000" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cargaHoraria">Carga horária (h/semana)</Label>
                          <Input id="cargaHoraria" type="number" {...profileForm.register("cargaHoraria")} placeholder="40" />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="especialidade">Especialidade</Label>
                          <Input id="especialidade" {...profileForm.register("especialidade")} placeholder="Clínica Geral" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>
                      <strong>Nível de acesso:</strong> {user?.nivel_acesso?.nome || "—"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span className="ml-2">Salvar alterações</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>Para sua segurança, informe a senha atual antes de definir uma nova.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha atual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      className="pr-10"
                      {...passwordForm.register("currentPassword")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowCurrentPassword((v) => !v)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 bg-transparent hover:bg-transparent text-text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-red-500">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova senha</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        className="pr-10"
                        {...passwordForm.register("newPassword")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 bg-transparent hover:bg-transparent text-text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                    <Input
                      id="confirmPassword"
                      type={showNewPassword ? "text" : "password"}
                      {...passwordForm.register("confirmPassword")}
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={savingPassword}>
                    {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                    <span className="ml-2">Alterar senha</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
