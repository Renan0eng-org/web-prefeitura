import {
    BarChart3,
    Bot,
    Calendar,
    ClipboardList,
    Home,
    ListStart,
    Logs,
    ScrollText,
    Shield,
    Stethoscope,
    User,
    UserCheck,
    UserPlus
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: any;
  isActive?: boolean;
  nivel_acesso?: string;
  items?: { title: string; url: string }[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const data = {
  user: {
    name: "PVAI SEM DOR",
    email: "pvaisedor@paranavai.saude.br",
    avatar: "/logo.webp"
  },

  navGroups: [
    {
      label: "Geral",
      items: [
        {
          title: "Home",
          url: "/admin",
          icon: Home,
          isActive: false,
          nivel_acesso: "",
        },
      ],
    },
    {
      label: "Atendimento",
      items: [
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
          icon: Calendar,
          isActive: false,
          nivel_acesso: "agendamento",
        },
        {
          title: "Atendimentos",
          url: "/admin/atendimentos",
          icon: Stethoscope,
          isActive: false,
          nivel_acesso: "atendimento",
        },
        {
          title: "Encaminhamentos",
          url: "/admin/encaminhamentos",
          icon: ListStart,
          isActive: false,
          nivel_acesso: "encaminhamento",
        },
      ],
    },
    {
      label: "Cadastros",
      items: [
        {
          title: "Pacientes",
          url: "/admin/pacientes",
          icon: UserPlus,
          isActive: false,
          nivel_acesso: "paciente",
        },
        {
          title: "Usuários",
          url: "/admin/usuarios",
          icon: User,
          isActive: false,
          nivel_acesso: "gerenciar-usuarios",
        },
        {
          title: "Formulários",
          url: "/admin/listar-formulario",
          icon: ClipboardList,
          isActive: false,
          nivel_acesso: "formulario",
        },
      ],
    },
    {
      label: "Administração",
      items: [
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
          title: "Logs",
          url: "/admin/logs",
          icon: ScrollText,
          isActive: false,
          nivel_acesso: "log",
        },
        {
          title: "IA - Triggers",
          url: "/admin/triggers-admin",
          icon: Bot,
          isActive: false,
          nivel_acesso: "chat-ai-admin",
        },
        {
          title: "IA - Analytics",
          url: "/admin/chat-analytics",
          icon: BarChart3,
          isActive: false,
          nivel_acesso: "chat-ai-admin",
        },
      ],
    },
  ] as NavGroup[],

  // Items for mobile bottom navigation (main screens)
  bottomNav: [
    {
      title: "Home",
      url: "/admin",
      icon: Home,
      nivel_acesso: "",
    },
    {
      title: "Esteira",
      url: "/admin/esteira-pacientes",
      icon: Logs,
      nivel_acesso: "esteira-pacientes",
    },
    {
      title: "Agendamentos",
      url: "/admin/agendamentos",
      icon: Calendar,
      nivel_acesso: "agendamento",
    },
    {
      title: "Atendimentos",
      url: "/admin/atendimentos",
      icon: Stethoscope,
      nivel_acesso: "atendimento",
    },
  ],

  // Keep flat list for backwards compat (used by permission filtering)
  get navMain() {
    return this.navGroups.flatMap(g => g.items);
  },

  flow: [] as NavItem[],
};
