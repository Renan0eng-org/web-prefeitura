import { EnumUserType } from "@/types/access-level"
import * as z from "zod"

export const userCreateFormSchema = z
  .object({
    name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres."),
    email: z.string().email("Formato de e-mail inválido."),
    // Senha e confirmação de senha são obrigatórias apenas na criação
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres."),
    passwordConfirmation: z.string().min(6, "Confirmação de senha deve ter no mínimo 6 caracteres."),
    avatar: z.string().optional().nullable(),
    cpf: z.string().optional(),
    cep: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    nivelAcessoId: z.string().min(1, "Nível de Acesso é obrigatório."),
    type: z.nativeEnum(EnumUserType),
    active: z.boolean(),
    locaisAtendimento: z.array(z.string()).optional(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "As senhas não coincidem.",
    path: ["passwordConfirmation"],
  })


export const userUpdateFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres."),
  email: z.string().email("Formato de e-mail inválido."),
  // Senha e confirmação de senha são obrigatórias apenas na criação
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres.").optional(),
  passwordConfirmation: z.string().min(6, "Confirmação de senha deve ter no mínimo 6 caracteres.").optional(),
  avatar: z.string().optional().nullable(),
  cpf: z.string().optional(),
  cep: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  nivelAcessoId: z.string().min(1, "Nível de Acesso é obrigatório."),
  type: z.nativeEnum(EnumUserType),
  active: z.boolean(),
  locaisAtendimento: z.array(z.string()).optional(),
})

  .refine((data) => {
    if (data.password || data.passwordConfirmation) {
      return data.password === data.passwordConfirmation
    }
    return true
  }, {
    message: "As senhas não coincidem.",
    path: ["passwordConfirmation"],
  })
