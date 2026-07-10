"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/services/api";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Informe seu e-mail.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao enviar e-mail. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-3 md:p-10">
      <div className="w-full max-w-sm">
        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-2xl text-text">
              {sent ? "E-mail enviado" : "Esqueci minha senha"}
            </CardTitle>
            <CardDescription className="text-text-foreground">
              {sent
                ? "Verifique sua caixa de entrada e siga as instruções para redefinir sua senha."
                : "Informe o e-mail cadastrado para receber um link de recuperação."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center rounded-lg bg-primary-50 p-6">
                  <Mail className="h-12 w-12 text-primary-500" />
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Enviamos um link para <strong>{email}</strong>. O link expira em 1 hora.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                >
                  Enviar novamente
                </Button>
                <div className="text-center">
                  <Link href="/auth/login" className="text-sm underline underline-offset-4">
                    <ArrowLeft className="mr-1 inline h-3 w-3" />
                    Voltar ao login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <Button disabled={loading} type="submit" className="w-full">
                  {loading ? <Loader2 className="animate-spin" /> : "Enviar link de recuperação"}
                </Button>
                <div className="text-center">
                  <Link href="/auth/login" className="text-sm underline underline-offset-4">
                    <ArrowLeft className="mr-1 inline h-3 w-3" />
                    Voltar ao login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
