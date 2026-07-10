export type NivelAcesso = {
  idNivelAcesso: number;
  nome: string;
  descricao: string | null;
}

export type MenuAcesso = {
  idMenuAcesso: number;
  nome: string;
  slug: string;
}

export type NivelMenuPermissao = {
  id: number;
  nivelAcessoId: number;
  menuAcessoId: number;
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
  relatorio: boolean;
  menu_acesso: MenuAcesso;
}

export type NivelAcessoComPermissoes = NivelAcesso & {
  permissoes: NivelMenuPermissao[];
}

export enum EnumUserType {
  ADMIN = "ADMIN",
  PACIENTE = "PACIENTE",
  USUARIO = "USUARIO",
  MEDICO = "MEDICO",
}

export type User = {
  idUser: string;
  name: string;
  avatar: string | null;
  email: string;
  cpf: string | null;
  cep: string | null;
  phone: string | null;
  created: string;
  updated: string | null;
  active: boolean;
  nivelAcessoId: number;
  type: EnumUserType;
}

export type UserComNivel = User & {
  nivel_acesso: NivelAcesso
}

export type GrupoMembro = {
  id: number;
  grupoId: number;
  userId: string;
  joinedAt: string;
  user: {
    idUser: string;
    name: string;
    email: string;
    avatar: string | null;
    type: EnumUserType;
    active: boolean;
    nivel_acesso: { idNivelAcesso: number; nome: string };
  };
}

export type Grupo = {
  idGrupo: number;
  nome: string;
  descricao: string | null;
  isDefault: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  membros: GrupoMembro[];
}

export type UserFormData = {
    name: string;
    email: string;
    password?: string;
    passwordConfirmation?: string;
    avatar?: string | null;
    cpf: string;
    cep?: string | null;
    phone?: string | null;
    nivelAcessoId: number;
    type: EnumUserType;
    active: boolean;
};
