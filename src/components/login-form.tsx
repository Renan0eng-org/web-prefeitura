"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { loginSchema, LoginSchema } from "@/schemas/login";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export function LoginForm() {
  const router = useRouter();

  const [redirect, setRedirect] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const [showPassword, setShowPassword] = useState(false);


  const { login } = useAuth();

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const redirect = queryParams.get("redirect");
    setRedirect(redirect);
    router.prefetch("/admin");
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    try {
      setLoading(true);
      await login(data.email, data.password);
      router.push(redirect || "/admin");
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card className="p-2">
        <CardHeader>
          <CardTitle className="text-2xl text-text">Entrar</CardTitle>
          <CardDescription className="text-text-foreground">
            Digite seu e-mail abaixo para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="text-text-foreground"
          >
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplo@email.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    className="pr-10"
                    {...register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-transparent text-text-foreground hover:bg-transparent"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <Button disabled={loading} type="submit" className="w-full">
                {loading ? <Loader2 className="animate-spin" /> : "Entrar"}
              </Button>
              {/* <Button disabled={loading} variant="outline" className="w-full">
            Entrar com o Google
          </Button> */}
            </div>
            <div className="mt-4 text-center text-sm">
              Não tem uma conta?{" "}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4"
              >
                Cadastre-se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>

  );
}
