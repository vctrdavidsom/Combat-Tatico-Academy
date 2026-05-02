"use client"

import { useState } from "react"
import { 
  Shield, 
  BookOpen, 
  Play, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Target,
  Award,
  Users
} from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"
import { initialBroadcasts } from "@/lib/admin-broadcasts"

const courses = [
  {
    id: 1,
    title: "Táticas de Combate Próximo",
    code: "CQC-001",
    progress: 45,
    modules: 8,
    completedModules: 4,
    status: "em_andamento",
    instructor: "Cap. Silva",
    thumbnail: "combat"
  },
  {
    id: 2,
    title: "Supervisor em Segurança Privada",
    code: "SSP-002",
    progress: 100,
    modules: 12,
    completedModules: 12,
    status: "concluido",
    instructor: "Ten. Oliveira",
    thumbnail: "security"
  },
  {
    id: 3,
    title: "Instrução de Armeiro",
    code: "ARM-003",
    progress: 0,
    modules: 10,
    completedModules: 0,
    status: "bloqueado",
    instructor: "Sgt. Costa",
    thumbnail: "weapons"
  }
]

const stats = [
  { label: "Horas de Treino", value: "42h", icon: Clock },
  { label: "Módulos Concluídos", value: "16", icon: CheckCircle2 },
  { label: "Certificações", value: "1", icon: Award },
  { label: "Ranking", value: "#23", icon: Target }
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("cursos")
  const notices = initialBroadcasts

  return (
    <div className="min-h-screen bg-background">
      <Header userName="Operador Delta" />

      <main className="p-4 sm:p-6">
        {/* Broadcast */}
        <div className="border border-border bg-card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Avisos Gerais
            </h2>
            <span className="text-xs text-[#6b7a5f]">{notices.length} ativos</span>
          </div>
          <div className="space-y-3">
            {notices.map((notice) => (
              <div key={notice.id} className="border border-border bg-secondary/30 p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-foreground font-bold">{notice.title}</p>
                  <span className="text-xs text-[#F4511E] uppercase tracking-wider">
                    {notice.priority}
                  </span>
                </div>
                <p className="text-xs text-[#6b7a5f]">{notice.message}</p>
                <p className="text-[10px] text-[#6b7a5f] mt-1">
                  {notice.createdAt} • {notice.author}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-[#6b7a5f] bg-[#6b7a5f]/10">
                  <stat.icon className="h-5 w-5 text-[#6b7a5f]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-border sm:gap-4">
          <button
            onClick={() => setActiveTab("cursos")}
            className={`pb-3 text-xs uppercase tracking-wider transition-colors sm:text-sm ${
              activeTab === "cursos"
                ? "text-[#F4511E] border-b-2 border-[#F4511E]"
                : "text-[#6b7a5f] hover:text-foreground"
            }`}
          >
            Meus Cursos
          </button>
          <button
            onClick={() => setActiveTab("certificados")}
            className={`pb-3 text-xs uppercase tracking-wider transition-colors sm:text-sm ${
              activeTab === "certificados"
                ? "text-[#F4511E] border-b-2 border-[#F4511E]"
                : "text-[#6b7a5f] hover:text-foreground"
            }`}
          >
            Certificados
          </button>
        </div>

        {/* Courses Grid */}
        {activeTab === "cursos" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {activeTab === "certificados" && (
          <div className="border border-border bg-card p-8 text-center">
            <Award className="h-12 w-12 text-[#F4511E] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">
              Supervisor em Segurança Privada
            </h3>
            <p className="text-sm text-[#6b7a5f] mb-4">
              Certificado emitido em 15/03/2024
            </p>
            <button className="text-sm text-[#F4511E] uppercase tracking-wider hover:underline">
              Baixar Certificado PDF
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function CourseCard({ course }: { course: typeof courses[0] }) {
  const statusConfig = {
    em_andamento: { label: "Em Andamento", color: "text-[#F4511E]", bg: "bg-[#F4511E]/10" },
    concluido: { label: "Concluído", color: "text-green-500", bg: "bg-green-500/10" },
    bloqueado: { label: "Bloqueado", color: "text-[#6b7a5f]", bg: "bg-[#6b7a5f]/10" }
  }

  const status = statusConfig[course.status as keyof typeof statusConfig]

  return (
    <div className="border border-border bg-card overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative h-40 bg-secondary flex items-center justify-center">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              #F4511E 10px,
              #F4511E 11px
            )`
          }} />
        </div>
        <Shield className="h-16 w-16 text-[#6b7a5f]" />
        {course.status === "em_andamento" && (
          <Link 
            href={`/curso/${course.id}`}
            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="flex h-14 w-14 items-center justify-center border-2 border-[#F4511E] bg-[#F4511E]">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <p className="text-xs text-[#6b7a5f] uppercase tracking-wider mb-1">
              {course.code}
            </p>
            <h3 className="font-bold text-foreground leading-tight break-words">
              {course.title}
            </h3>
          </div>
          <span className={`text-xs px-2 py-1 uppercase tracking-wider ${status.color} ${status.bg}`}>
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#6b7a5f] mb-4">
          <Users className="h-3 w-3" />
          <span>{course.instructor}</span>
        </div>

        {/* Progress */}
        {course.status !== "bloqueado" && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-[#6b7a5f]">Progresso</span>
              <span className="text-foreground">{course.progress}%</span>
            </div>
            <div className="h-1 bg-secondary">
              <div 
                className="h-full bg-[#F4511E] transition-all"
                style={{ width: `${course.progress}%` }}
              />
            </div>
            <p className="text-xs text-[#6b7a5f] mt-2">
              {course.completedModules}/{course.modules} módulos
            </p>
          </div>
        )}

        {/* Action */}
        {course.status === "em_andamento" && (
          <Link 
            href={`/curso/${course.id}`}
            className="flex items-center justify-between w-full p-3 border border-[#F4511E] text-[#F4511E] hover:bg-[#F4511E] hover:text-white transition-colors"
          >
            <span className="text-sm uppercase tracking-wider">Continuar</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}

        {course.status === "concluido" && (
          <Link 
            href={`/curso/${course.id}`}
            className="flex items-center justify-between w-full p-3 border border-[#6b7a5f] text-[#6b7a5f] hover:bg-[#6b7a5f] hover:text-white transition-colors"
          >
            <span className="text-sm uppercase tracking-wider">Revisar</span>
            <BookOpen className="h-4 w-4" />
          </Link>
        )}

        {course.status === "bloqueado" && (
          <div className="p-3 border border-border text-center text-[#6b7a5f] text-sm">
            Aguardando Liberação
          </div>
        )}
      </div>
    </div>
  )
}
