import { ArrowRight, BarChart3, Brain, Heart, MapPin, Shield, Users } from "lucide-react";
import Link from "next/link";

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
