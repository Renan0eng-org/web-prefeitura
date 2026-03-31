import * as z from "zod"

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export type LoginSchema = z.infer<typeof loginSchema>


export const signUpSchema = z
  .object({
    name: z.string().min(1, "Nome completo é obrigatório"),
    email: z.string().email("Informe um e-mail válido"),
    cpf: z.string().min(11, "CPF é obrigatório").max(14, "CPF inválido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type SignUpSchema = z.infer<typeof signUpSchema>