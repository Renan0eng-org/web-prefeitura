"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/services/api";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const requested = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Link de verificação inválido.");
      return;
    }
    if (requested.current) return;
    requested.current = true;

    api
      .post("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setErrorMessage(err.response?.data?.message || "Erro ao verificar e-mail. O link pode ter expirado.");
      });
  }, [token]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-3 md:p-10">
      <div className="w-full max-w-sm">
        <Card className="p-2">
          <CardHeader>
            <CardTitle className="text-2xl text-text">
              {status === "loading" && "Verificando e-mail..."}
              {status === "success" && "E-mail verificado"}
              {status === "error" && "Verificação falhou"}
            </CardTitle>
            <CardDescription className="text-text-foreground">
              {status === "loading" && "Aguarde enquanto confirmamos seu e-mail."}
              {status === "success" && "Seu e-mail foi confirmado com sucesso."}
              {status === "error" && errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "loading" && (
              <div className="flex items-center justify-center rounded-lg bg-muted p-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            )}
            {status === "success" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center rounded-lg bg-green-50 p-6">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <Link href="/auth/login">
                  <Button className="w-full">Ir para o login</Button>
                </Link>
              </div>
            )}
            {status === "error" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center rounded-lg bg-red-50 p-6">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">Voltar ao login</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
