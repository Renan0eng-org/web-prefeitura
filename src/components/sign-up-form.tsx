"use client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAlert } from "@/hooks/use-alert"
import { cn } from "@/lib/utils"
import { signUpSchema, SignUpSchema } from "@/schemas/login"
import api from "@/services/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"


export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {

  const [loading, setLoading] = useState<boolean>(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  const router = useRouter()

    const { setAlert } = useAlert()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
  })

  // Função para lidar com o envio do formulário
  const onSubmit = async (data: SignUpSchema) => {
    try {
      const { confirmPassword, ...user } = data;
      api.post("/auth/register-web", user).then(() => {
        setAlert("Cadastro realizado com sucesso! Por favor, faça o login.")
        router.push("/auth/login")
      }).catch((error: any) => {
        if (error.response && error.response.data && error.response.data.message) {
          setAlert(error.response.data.message, "error")
        } else {
          setAlert("Erro ao cadastrar. Por favor, tente novamente.", "error")
        }
      });
    } catch (err) {
      setAlert("Erro ao cadastrar. Por favor, tente novamente.", "error")
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-text">Cadastro</CardTitle>
          <CardDescription className="text-text-foreground">
            Crie sua conta preenchendo o formulário abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="text-text-foreground">
            <div className="flex flex-col gap-6">
              {/* Nome completo */}
              <div className="grid gap-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="João da Silva"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* E-mail */}
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

              {/* CPF */}
              <div className="grid gap-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  {...register("cpf")}
                />
                {errors.cpf && (
                  <p className="text-sm text-red-500">{errors.cpf.message}</p>
                )}
              </div>

              {/* Senha */}
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite uma senha forte"
                    className="pr-10"
                    {...register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-transparent text-text-foreground hover:bg-transparent"
                    aria-label="Mostrar ou ocultar senha"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Confirmar senha */}
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPasswordConfirmation ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    className="pr-10"
                    {...register("confirmPassword")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-transparent text-text-foreground hover:bg-transparent"
                    aria-label="Mostrar ou ocultar confirmação de senha"
                  >
                    {showPasswordConfirmation ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Botão cadastrar */}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="animate-spin" /> : "Cadastrar"}
              </Button>

              {/* Botão Google - comentado */}
              {/* <Button variant="outline" className="w-full">
            Cadastrar com Google
          </Button> */}
            </div>

            {/* Link para login */}
            <div className="mt-4 text-center text-sm">
              Já tem uma conta?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Entrar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>

  )
}