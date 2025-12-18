import {
  ClipboardList,
  Home,
  ListStart,
  Logs,
  Shield,
  User,
  UserCheck,
  UserPlus
} from "lucide-react";


export const data = {
  user: {
    name: "PVAI SEM DOR",
    email: "pvaisedor@paranavai.saude.br",
    avatar: "/logo.webp"
  },
  
  navMain: [
    {
      title: "Home",
      url: "/admin",
      icon: Home,
      isActive: false,
      nivel_acesso: "",
    },
    {
      title: "Formulários",
      url: "/admin/listar-formulario",
      icon: ClipboardList,
      isActive: false,
      nivel_acesso: "formulario",
    },
    {
      title: "Esteira de Pacientes",
      url: "/admin/esteira-pacientes",
      icon: Logs,
      isActive: false,
      nivel_acesso: "esteira-pacientes",
    },
    {
      title: "Agendamentos",
      url: "/admin/agendamentos",
      icon: ClipboardList,
      isActive: false,
      nivel_acesso: "agendamento",
    },
    {
      title: "Encaminhamentos",
      url: "/admin/encaminhamentos",
      icon: ListStart,
      isActive: false,
      nivel_acesso: "encaminhamento",
    },
    {
      title: "Controle de Acesso",
      url: "/admin/acessos",
      icon: Shield,
      isActive: false,
      nivel_acesso: "acesso",
    },
    {
      title: "Ativação de Usuários",
      url: "/admin/ativacao-usuarios",
      icon: UserCheck,
      isActive: false,
      nivel_acesso: "acesso",
    },
    {
      title: "Ativação de Pacientes",
      url: "/admin/ativacao-pacientes",
      icon: UserPlus,
      isActive: false,
      nivel_acesso: "acesso",
    },
    {
      title: "Usuários",
      url: "/admin/usuarios",
      icon: User,
      isActive: false,
      nivel_acesso: "gerenciar-usuarios",
    },
    {
      title: "Pacientes",
      url: "/admin/pacientes",
      icon: UserPlus,
      isActive: false,
      nivel_acesso: "paciente",
    },
    {
      title: "Logs",
      url: "/admin/logs",
      icon: ClipboardList,
      isActive: false,
      nivel_acesso: "log",
    },
  ],
  flow: [
    // {
    //   title: "Chegada Alevinos",
    //   url: "/admin/chegada/alevinos",
    //   icon: Fish,
    //   isActive: false,
    //   nivel_acesso: "chegada-alevinos",
    // },
    // {
    //   title: "Trato",
    //   url: "/admin/trato",
    //   icon: Ham,
    //   isActive: false,
    //   nivel_acesso: "trato",
    // },
  ],
};
