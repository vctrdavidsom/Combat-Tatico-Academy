"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  CheckCircle2,
  XCircle,
  BookOpen,
  Clock,
  Award,
  User
} from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

// Mock data - em produção viria do banco de dados
const studentsData: Record<string, {
  id: number
  name: string
  email: string
  enrolled: string
  status: string
  phone: string
  courses: Record<string, boolean>
}> = {
  "1": {
    id: 1,
    name: "João Silva",
    email: "joao.silva@email.com",
    enrolled: "15/01/2024",
    status: "ativo",
    phone: "(11) 99999-1234",
    courses: {
      "CQC-001": true,
      "SSP-002": true,
      "ARM-003": false
    }
  },
  "2": {
    id: 2,
    name: "Maria Santos",
    email: "maria.santos@email.com",
    enrolled: "22/02/2024",
    status: "ativo",
    phone: "(11) 99999-5678",
    courses: {
      "CQC-001": true,
      "SSP-002": false,
      "ARM-003": false
    }
  },
  "3": {
    id: 3,
    name: "Carlos Oliveira",
    email: "carlos.oliveira@email.com",
    enrolled: "08/03/2024",
    status: "pendente",
    phone: "(11) 99999-9012",
    courses: {
      "CQC-001": false,
      "SSP-002": false,
      "ARM-003": false
    }
  },
  "4": {
    id: 4,
    name: "Ana Costa",
    email: "ana.costa@email.com",
    enrolled: "10/01/2024",
    status: "ativo",
    phone: "(11) 99999-3456",
    courses: {
      "CQC-001": true,
      "SSP-002": true,
      "ARM-003": true
    }
  },
  "5": {
    id: 5,
    name: "Pedro Ferreira",
    email: "pedro.ferreira@email.com",
    enrolled: "28/02/2024",
    status: "inativo",
    phone: "(11) 99999-7890",
    courses: {
      "CQC-001": true,
      "SSP-002": false,
      "ARM-003": false
    }
  }
}

const coursesList = [
  { 
    code: "CQC-001", 
    name: "Táticas de Combate Próximo",
    modules: 8,
    hours: 24,
    description: "Técnicas avançadas de defesa pessoal e combate corpo a corpo para situações de alto risco."
  },
  { 
    code: "SSP-002", 
    name: "Supervisor em Segurança Privada",
    modules: 12,
    hours: 60,
    description: "Formação completa para supervisores de equipes de segurança patrimonial e pessoal."
  },
  { 
    code: "ARM-003", 
    name: "Instrução de Armeiro",
    modules: 10,
    hours: 40,
    description: "Curso técnico sobre manutenção, reparo e manuseio seguro de armamentos."
  }
]

const auditLog = [
  {
    id: 1,
    action: "Curso liberado",
    admin: "Comandante Admin",
    date: "02/05/2026",
    details: "CQC-001"
  },
  {
    id: 2,
    action: "Curso bloqueado",
    admin: "Instrutor Alpha",
    date: "29/04/2026",
    details: "ARM-003"
  }
]

export default function StudentPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string

  const initialStudent = studentsData[studentId]
  const [student, setStudent] = useState(initialStudent)
  const [hasChanges, setHasChanges] = useState(false)

  if (!student) {
    return (
      <div className="min-h-screen bg-background">
        <Header userName="Comandante Admin" isAdmin />
        <main className="p-4 md:p-6">
          <div className="text-center py-12">
            <p className="text-[#6b7a5f]">Aluno não encontrado.</p>
            <Button 
              onClick={() => router.push("/admin")}
              className="mt-4 bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none"
            >
              Voltar ao Painel
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ativo":
        return { label: "Ativo", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500" }
      case "pendente":
        return { label: "Pendente", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500" }
      case "inativo":
        return { label: "Inativo", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500" }
      default:
        return { label: status, color: "text-[#6b7a5f]", bg: "bg-[#6b7a5f]/10", border: "border-[#6b7a5f]" }
    }
  }

  const handleCourseToggle = (courseCode: string) => {
    setStudent(prev => ({
      ...prev,
      courses: {
        ...prev.courses,
        [courseCode]: !prev.courses[courseCode]
      }
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    // Em produção, aqui salvaria no banco de dados
    setHasChanges(false)
    // Feedback visual de sucesso poderia ser adicionado aqui
  }

  const statusConfig = getStatusConfig(student.status)
  const activeCourses = Object.values(student.courses).filter(Boolean).length

  return (
    <div className="min-h-screen bg-background">
      <Header userName="Comandante Admin" isAdmin />

      <main className="p-4 md:p-6">
        {/* Back Button */}
        <button 
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2 text-[#6b7a5f] hover:text-[#F4511E] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm uppercase tracking-wider">Voltar ao Painel</span>
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Student Info Card */}
          <div className="lg:col-span-1">
            <div className="border border-border bg-card">
              {/* Header */}
              <div className="p-4 border-b border-border sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center bg-[#6b7a5f]/20 border-2 border-[#6b7a5f]">
                    <span className="text-xl font-bold text-[#6b7a5f]">
                      {student.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      {student.name}
                    </h1>
                    <span className={`text-xs px-2 py-1 uppercase tracking-wider ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border} border`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-[#6b7a5f]" />
                  <div>
                    <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Email</p>
                    <p className="text-sm text-foreground">{student.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-[#6b7a5f]" />
                  <div>
                    <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Telefone</p>
                    <p className="text-sm text-foreground">{student.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-[#6b7a5f]" />
                  <div>
                    <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Data de Matrícula</p>
                    <p className="text-sm text-foreground">{student.enrolled}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-4 border-t border-border sm:p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[#F4511E]">{activeCourses}</p>
                    <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Cursos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">0</p>
                    <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Certificados</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">0h</p>
                    <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Treino</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Management */}
          <div className="lg:col-span-2">
            <div className="border border-border bg-card">
              <div className="p-4 border-b border-border flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
                    <BookOpen className="h-5 w-5 text-[#F4511E]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">Gerenciar Cursos</h2>
                    <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                      Liberar ou Bloquear Acesso
                    </p>
                  </div>
                </div>
                {hasChanges && (
                  <Button 
                    onClick={handleSave}
                    className="bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none w-full sm:w-auto"
                  >
                    Salvar Alterações
                  </Button>
                )}
              </div>

              <div className="divide-y divide-border">
                {coursesList.map((course) => {
                  const isEnabled = student.courses[course.code]
                  return (
                    <div 
                      key={course.code}
                      className={`p-4 transition-colors ${isEnabled ? "bg-[#F4511E]/5" : ""}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center border ${isEnabled ? "border-[#F4511E] bg-[#F4511E]/10" : "border-[#6b7a5f] bg-[#6b7a5f]/10"}`}>
                          <Shield className={`h-6 w-6 ${isEnabled ? "text-[#F4511E]" : "text-[#6b7a5f]"}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                                  {course.code}
                                </span>
                                {isEnabled ? (
                                  <span className="flex items-center gap-1 text-xs text-green-500">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Liberado
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs text-red-500">
                                    <XCircle className="h-3 w-3" />
                                    Bloqueado
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-foreground mb-2">
                                {course.name}
                              </h3>
                              <p className="text-sm text-[#6b7a5f] mb-3 break-words">
                                {course.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6b7a5f]">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {course.modules} módulos
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {course.hours}h de conteúdo
                                </span>
                                <span className="flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  Certificado incluso
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 sm:shrink-0">
                              <span className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                                {isEnabled ? "Ativo" : "Inativo"}
                              </span>
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={() => handleCourseToggle(course.code)}
                                className="data-[state=checked]:bg-[#F4511E]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Activity Log */}
            <div className="border border-border bg-card mt-6">
              <div className="p-4 border-b border-border">
                <h3 className="font-bold text-foreground">Auditoria de Acoes</h3>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                  Historico de permissoes e desbloqueios
                </p>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {auditLog.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-[#F4511E]" />
                      <span className="text-[#6b7a5f]">
                        {entry.action} por {entry.admin} em {entry.date} - {entry.details}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="border border-border bg-card mt-6">
              <div className="p-4 border-b border-border">
                <h3 className="font-bold text-foreground">Histórico de Atividades</h3>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                  Últimas ações do aluno
                </p>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-[#6b7a5f]" />
                    <span className="text-[#6b7a5f]">Nenhuma atividade registrada ainda.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
