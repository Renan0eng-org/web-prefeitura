import { ArrowRight, BarChart3, Brain, Download, Heart, MapPin, Shield, Smartphone, Users } from "lucide-react";
import Link from "next/link";

const DEVELOPERS = [
  {
    name: "Renan Nardi",
    role: "Programador Full Stack",
    company: "TSP — The Silicon Partners",
    photo: "/renan.png",
  },
  {
    name: "Marco",
    role: "Programador Full Stack",
    company: "Amed Saúde",
    photo: "/marco.png",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="Logo PVAI Sem Dor" className="h-9 w-9" />
            <span className="text-lg font-bold text-primary-500">PVAI SEM DOR</span>
          </div>
          <nav className="flex items-center gap-3">
            <a
              href="#download"
              className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-neutrals-700 transition hover:bg-neutral-100 sm:inline-flex"
            >
              Baixar App
            </a>
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-primary-500 transition hover:bg-primary-50"
            >
              Entrar
            </Link>
            <Link
              href="/auth/sign-up"
              className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600"
            >
              Cadastrar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 py-20 sm:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-white" />
          <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            <MapPin className="h-4 w-4" />
            Paranavaí, Paraná
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Paranavaí Sem Dor
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
            Mapeamento inteligente de dores crônicas para direcionar pacientes
            ao tratamento mais adequado. Uma parceria entre a{" "}
            <strong>Prefeitura de Paranavaí</strong> e a{" "}
            <strong>Universidade Paranaense (UNIPAR)</strong>.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/sign-up"
              className="flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-primary-500 shadow-lg transition hover:shadow-xl"
            >
              Comece agora
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/auth/login"
              className="flex items-center gap-2 rounded-xl border-2 border-white/40 px-8 py-3.5 text-base font-bold text-white transition hover:bg-white/10"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-neutrals-900 sm:text-4xl">
              Como funciona
            </h2>
            <p className="mx-auto max-w-2xl text-neutrals-600">
              Um fluxo completo de triagem e acompanhamento, do registro do
              paciente ao direcionamento para o tratamento ideal.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Users,
                title: "Cadastro do Paciente",
                description:
                  "Profissionais de saúde registram os pacientes com dados clínicos e histórico de dores crônicas.",
              },
              {
                icon: Brain,
                title: "Triagem Inteligente",
                description:
                  "Formulários dinâmicos mapeiam o tipo, intensidade e localização da dor para gerar um perfil completo.",
              },
              {
                icon: Heart,
                title: "Direcionamento Automático",
                description:
                  "O sistema encaminha automaticamente o paciente para a especialidade e tratamento mais indicados.",
              },
              {
                icon: BarChart3,
                title: "Dashboards e Relatórios",
                description:
                  "Gestores acompanham indicadores em tempo real: volume de atendimentos, tipos de dor prevalentes e eficácia dos tratamentos.",
              },
              {
                icon: Shield,
                title: "Níveis de Acesso",
                description:
                  "Controle granular de permissões garante que cada profissional veja apenas o que é relevante para sua função.",
              },
              {
                icon: MapPin,
                title: "Mapeamento Regional",
                description:
                  "Dados georreferenciados permitem identificar áreas com maior incidência de dores crônicas no município.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-primary-200 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-500 transition group-hover:bg-primary-500 group-hover:text-white">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-neutrals-900">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-neutrals-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-neutrals-900 sm:text-4xl">
                Uma parceria pela saúde pública
              </h2>
              <p className="mb-6 leading-relaxed text-neutrals-600">
                O projeto <strong>Paranavaí Sem Dor</strong> nasceu da união
                entre a <strong>Secretaria Municipal de Saúde de Paranavaí</strong>{" "}
                e a <strong>Universidade Paranaense (UNIPAR)</strong>, com o
                objetivo de utilizar tecnologia para melhorar o atendimento a
                pacientes com dores crônicas.
              </p>
              <p className="mb-6 leading-relaxed text-neutrals-600">
                Através da coleta e análise inteligente de dados, o sistema
                permite que profissionais de saúde tomem decisões mais rápidas e
                assertivas, reduzindo o tempo de espera dos pacientes e
                otimizando os recursos da rede pública de saúde.
              </p>
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-3xl font-bold text-primary-500">+1.000</p>
                  <p className="text-sm text-neutrals-500">Pacientes mapeados</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-secondary-500">100%</p>
                  <p className="text-sm text-neutrals-500">Digital e gratuito</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-accent-400">24/7</p>
                  <p className="text-sm text-neutrals-500">Acesso ao sistema</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary-100 to-secondary-100 blur-2xl" />
                <div className="relative flex flex-col items-center gap-6 rounded-2xl bg-white p-10 shadow-lg">
                  <img src="/logo.webp" alt="Logo PVAI Sem Dor" className="h-24 w-24" />
                  <div className="text-center">
                    <p className="text-xl font-bold text-neutrals-900">PVAI SEM DOR</p>
                    <p className="text-sm text-neutrals-500">
                      Prefeitura de Paranavaí + UNIPAR
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="download" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="flex items-center justify-center order-2 lg:order-1">
              <div className="relative">
                <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-primary-100 to-secondary-100 blur-2xl" />
                <div className="relative mx-auto h-[520px] w-[260px] rounded-[2.5rem] border-[10px] border-neutrals-900 bg-neutrals-900 shadow-2xl">
                  <div className="absolute left-1/2 top-0 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-neutrals-900" />
                  <div className="flex h-full w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 px-6 text-center">
                    <img src="/logo.webp" alt="App PVAI Sem Dor" className="h-24 w-24 drop-shadow-lg" />
                    <div>
                      <p className="text-2xl font-bold text-white">PVAI SEM DOR</p>
                      <p className="mt-1 text-sm text-white/80">Saúde na palma da sua mão</p>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm">
                      <Smartphone className="h-4 w-4" />
                      App Android
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-medium text-primary-500">
                <Smartphone className="h-4 w-4" />
                Aplicativo móvel
              </div>
              <h2 className="mb-4 text-3xl font-bold text-neutrals-900 sm:text-4xl">
                Baixe nosso aplicativo
              </h2>
              <p className="mb-8 leading-relaxed text-neutrals-600">
                Leve o <strong>PVAI Sem Dor</strong> no seu bolso. Com o aplicativo você
                acompanha seus atendimentos, responde às triagens e recebe orientações
                de forma prática, direto do seu celular.
              </p>
              <a
                href="/prefeitura.apk"
                download
                className="inline-flex items-center gap-3 rounded-xl bg-primary-500 px-8 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-primary-600 hover:shadow-xl"
              >
                <Download className="h-5 w-5" />
                Baixar APK
              </a>
              <p className="mt-4 text-xs text-neutrals-500">
                Compatível com Android. Após o download, permita a instalação de fontes externas.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="desenvolvedores" className="bg-neutral-50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-neutrals-900 sm:text-4xl">
              Desenvolvedores
            </h2>
            <p className="mx-auto max-w-2xl text-neutrals-600">
              Conheça os responsáveis pelo desenvolvimento do sistema.
            </p>
          </div>
          <div className="mx-auto grid max-w-2xl gap-6 sm:grid-cols-2">
            {DEVELOPERS.map((dev) => (
              <div
                key={dev.name}
                className="flex flex-col items-center rounded-2xl border border-neutral-200 bg-white p-8 text-center transition hover:border-primary-200 hover:shadow-lg"
              >
                <img
                  src={dev.photo}
                  alt={dev.name}
                  className="mb-4 h-28 w-28 rounded-full object-cover ring-4 ring-primary-50"
                />
                <h3 className="text-lg font-bold text-neutrals-900">{dev.name}</h3>
                <p className="mt-1 text-sm font-medium text-primary-500">{dev.role}</p>
                <p className="mt-1 text-sm text-neutrals-500">{dev.company}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-primary-500 to-secondary-500 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Faça parte dessa transformação
          </h2>
          <p className="mb-8 text-lg text-white/80">
            Profissionais de saúde de Paranavaí podem se cadastrar e começar a
            utilizar o sistema agora mesmo.
          </p>
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-primary-500 shadow-lg transition hover:shadow-xl"
          >
            Criar minha conta
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <img src="/logo.webp" alt="Logo" className="h-6 w-6" />
              <span className="text-sm font-semibold text-neutrals-700">PVAI SEM DOR</span>
            </div>
            <p className="text-sm text-neutrals-500">
              Prefeitura de Paranavaí &bull; UNIPAR &bull; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
