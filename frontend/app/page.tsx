import Image from "next/image"
import Link from "next/link"

const whatsappLink = "https://wa.me/5561981737133"

const courses = [
  {
    title: "Curso de Armeiro",
    date: "06 de Junho",
    description:
      "Treinamento avançado voltado para a montagem de terceiro escalão, conserto e manutenção de armas de fogo. O aluno aprende na prática o conceito e as atribuições do armeiro.",
    image: "/curso de armeiro.avif",
    alt: "Curso de Armeiro"
  },
  {
    title: "Curso de CFTV",
    date: "25 e 26 de Abril",
    description:
      "O curso de CFTV prepara o profissional para o mercado de trabalho, abordando operações do sistema, protocolos de observação, tecnologia e comunicação.",
    image: "/curso de cftv.avif",
    alt: "Curso de CFTV"
  },
  {
    title: "Curso Bala Rosa - Auto Defesa Feminina",
    date: "17 de Maio",
    description:
      "Curso de auto defesa feminina para mulheres que desejam adquirir conhecimento em armamento e tiro, aprender técnicas de defesa pessoal e aumentar sua segurança no dia a dia.",
    image: "/curso bala rosa.avif",
    alt: "Curso Bala Rosa"
  },
  {
    title: "Curso de Supervisor de Segurança Privada",
    date: "11 e 12 de Abril",
    description:
      "Formação de profissionais aptos a planejar, coordenar e supervisionar equipes e operações de segurança, em conformidade com a legislação vigente.",
    image: "/Professional Business Portrait.avif",
    alt: "Curso de Supervisor de Segurança Privada"
  }
]

const highlights = [
  {
    title: "Artigos militares",
    description: "Equipamentos táticos de alta qualidade para o dia a dia operacional."
  },
  {
    title: "Treinamentos profissionais",
    description: "Cursos focados em segurança, com conteúdo direto e aplicável."
  },
  {
    title: "Centro especializado",
    description: "A Combat Tático une loja e treinamentos em um só lugar."
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image
                src="/logo.png"
                alt="Combat Tático"
                fill
                sizes="40px"
                className="object-contain"
                priority
              />
            </div>
            <div className="leading-tight">
              <span className="block text-xs font-semibold uppercase tracking-[0.3em]">Combat Tático</span>
              <span className="block text-[10px] uppercase tracking-[0.35em] text-white/60">Academy</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-[11px] uppercase tracking-[0.25em] text-white/70 lg:flex">
            <a href="#sobre" className="transition hover:text-white">Sobre</a>
            <a href="#cursos" className="transition hover:text-white">Cursos</a>
            <a href="#contato" className="transition hover:text-white">Contato</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer noopener"
              className="hidden items-center justify-center border border-white/20 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-white/70 transition hover:border-white/50 hover:text-white sm:inline-flex"
            >
              WhatsApp
            </a>
            <Link
              href="/login"
              className="inline-flex items-center justify-center border border-[#F4511E] px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-[#F4511E] transition hover:bg-[#F4511E] hover:text-white"
            >
              ÁREA DO ALUNO
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/tactical-background.jpg"
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-[#0b0b0b]" />
          </div>

          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-24 lg:flex-row lg:items-center lg:py-32">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.4em] text-[#F4511E]">
                Equipamentos e conhecimento para segurança
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Combat Tático
              </h1>
              <p className="mt-6 text-base text-white/80 sm:text-lg">
                A Combat Tático é sua loja online de artigos militares e centro de treinamentos especializado.
                Oferecemos equipamentos táticos de alta qualidade e cursos profissionais de segurança.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center justify-center bg-[#F4511E] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[#F4511E]/90"
                >
                  Falar no WhatsApp
                </a>
                <a
                  href="#cursos"
                  className="inline-flex items-center justify-center border border-white/40 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-[#F4511E]"
                >
                  Ver cursos
                </a>
              </div>
            </div>

            <div className="grid w-full max-w-md gap-4 rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-white/70 backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Contato direto</p>
                <p className="mt-2 text-lg font-semibold text-white">(61) 98173-7133</p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Centro de treinamentos</p>
                <p className="mt-2">Cursos focados em segurança, com conteúdo prático e aplicado.</p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Área do aluno</p>
                <p className="mt-2">Acesse sua plataforma online e acompanhe seu progresso.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="sobre" className="bg-[#0b0b0b] py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.4em] text-[#F4511E]">Sobre</p>
              <h2 className="text-3xl font-semibold">Combat Tático - centro de treinamentos e artigos militares</h2>
              <p className="max-w-2xl text-sm text-white/70">
                Nossa missão é entregar equipamentos e conhecimento para quem atua com segurança.
                Unimos loja especializada e treinamentos profissionais em um ambiente único.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-white/10 bg-black/40 p-6"
                >
                  <h3 className="text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-white/70">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cursos" className="bg-black py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-[0.4em] text-[#F4511E]">Treinamentos</p>
              <h2 className="text-3xl font-semibold">Nossos Cursos e Treinamentos</h2>
              <p className="max-w-2xl text-sm text-white/70">
                Confira as próximas turmas e fale com nossa equipe para garantir sua vaga.
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {courses.map((course) => (
                <article
                  key={course.title}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f]"
                >
                  <div className="relative h-48 w-full">
                    <Image
                      src={course.image}
                      alt={course.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#F4511E]">{course.date}</p>
                    <h3 className="mt-3 text-xl font-semibold text-white">{course.title}</h3>
                    <p className="mt-3 text-sm text-white/70">{course.description}</p>
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-6 inline-flex items-center justify-center border border-[#F4511E] px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-[#F4511E] transition hover:bg-[#F4511E] hover:text-white"
                    >
                      Quero me inscrever
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="contato" className="bg-[#0b0b0b] py-16">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="grid gap-8 rounded-2xl border border-white/10 bg-black/50 p-8 md:grid-cols-[1.5fr_1fr] md:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-[#F4511E]">Contato</p>
                <h2 className="mt-3 text-2xl font-semibold">Fale com nossa equipe</h2>
                <p className="mt-4 text-sm text-white/70">
                  Matrículas, dúvidas e informações adicionais. Estamos prontos para ajudar você a escolher o
                  treinamento ideal.
                </p>
                <p className="mt-4 text-sm text-white/80">WhatsApp: (61) 98173-7133</p>
              </div>

              <div className="flex flex-col gap-4">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center justify-center bg-[#F4511E] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-[#F4511E]/90"
                >
                  Chamar no WhatsApp
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center border border-[#F4511E] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#F4511E] transition hover:bg-[#F4511E] hover:text-white"
                >
                  Área do aluno
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 text-[11px] uppercase tracking-[0.3em] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Combat Tático</span>
          <span>Equipamentos e conhecimento para segurança</span>
        </div>
      </footer>
    </div>
  )
}
