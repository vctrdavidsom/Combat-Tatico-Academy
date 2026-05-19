"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  BookOpen,
  Award,
  ClipboardList,
  FileText,
  LogOut,
  Shield,
  Target,
  UploadCloud,
  User,
  CheckCircle2,
  XCircle,
  KeyRound,
  ChevronRight,
  CircleDot
} from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useCombatContext,
  type Question,
  type UserDocument
} from "@/contexts/CombatContext"

type SectionKey = "cursos" | "dados" | "atividades" | "notas"

type AttemptContext = {
  courseName: string
  moduleName?: string
  activityName: string
  questions: Question[]
}

type ObjectiveScore = {
  correct: number
  total: number
  partialPoints: number
  totalPoints: number
}

export default function DashboardPage() {
  const router = useRouter()
  const {
    listaCursos,
    tentativasExames,
    currentUser,
    logout,
    adicionarDocumentoAluno,
    alterarSenhaAluno,
    markAsRead
  } = useCombatContext()

  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState<SectionKey>("cursos")
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const availableCourses = useMemo(() => {
    if (!currentUser) return []
    return listaCursos.filter((course) => currentUser.courses?.[course.id])
  }, [listaCursos, currentUser])

  const studentAttempts = useMemo(() => {
    if (!currentUser) return []
    return tentativasExames.filter((attempt) => attempt.userId === currentUser.id)
  }, [tentativasExames, currentUser])

  useEffect(() => {
    const sectionParam = searchParams.get("section") as SectionKey | null
    if (sectionParam && ["cursos", "dados", "atividades", "notas"].includes(sectionParam)) {
      setActiveSection(sectionParam)
    }
    const attemptParam = Number(searchParams.get("attemptId"))
    if (sectionParam === "atividades" && attemptParam) {
      const exists = studentAttempts.find((attempt) => attempt.id === attemptParam)
      if (exists) {
        setSelectedAttemptId(attemptParam)
      }
    }
  }, [searchParams, studentAttempts])

  useEffect(() => {
    if (!studentAttempts.length) return
    if (!selectedAttemptId || !studentAttempts.find((a) => a.id === selectedAttemptId)) {
      setSelectedAttemptId(studentAttempts[0].id)
    }
  }, [studentAttempts, selectedAttemptId])

  const pendingCriticalNotice = useMemo(() => {
    if (!currentUser) return null
    const pending = currentUser.notifications
      .filter((notice) =>
        notice.scope === "global" &&
        notice.severity === "critical" &&
        !notice.read
      )
      .sort((a, b) => b.id - a.id)
    return pending[0] ?? null
  }, [currentUser])

  const selectedAttempt = useMemo(() => {
    if (!selectedAttemptId) return null
    return studentAttempts.find((attempt) => attempt.id === selectedAttemptId) || null
  }, [studentAttempts, selectedAttemptId])

  const selectedAttemptContext = useMemo((): AttemptContext | null => {
    if (!selectedAttempt) return null
    const course = listaCursos.find((item) => item.id === selectedAttempt.courseId)
    if (!course) return null

    if (selectedAttempt.examType === "final") {
      return {
        courseName: course.name,
        activityName: course.finalExam?.title || selectedAttempt.title,
        questions: course.finalExam?.questions || []
      }
    }

    const module =
      course.modules.find((item) => item.id === selectedAttempt.moduleId) ||
      course.modules.find((item) => item.exams.some((exam) => exam.id === selectedAttempt.examId))
    const item = module?.exams.find((exam) => exam.id === selectedAttempt.examId)

    return {
      courseName: course.name,
      moduleName: module?.name,
      activityName: item?.title || selectedAttempt.title,
      questions: item?.questions || []
    }
  }, [selectedAttempt, listaCursos])

  const sumQuestionPoints = (questions: Question[]) =>
    Number(
      questions.reduce((sum, question) => sum + (question.weight ?? 1), 0).toFixed(2)
    )

  const sumObjectivePoints = (questions: Question[], answers: Record<number, string | number>) => {
    let correct = 0
    let total = 0
    let points = 0
    questions.forEach((question) => {
      if (question.type !== "multiple") return
      const weight = question.weight ?? 1
      total += 1
      if (answers[question.id] === question.correctIndex) {
        correct += 1
        points += weight
      }
    })
    return { correct, total, points: Number(points.toFixed(2)) }
  }

  const objectiveScore = useMemo((): ObjectiveScore | null => {
    if (!selectedAttemptContext || !selectedAttempt) return null
    const totals = sumObjectivePoints(selectedAttemptContext.questions, selectedAttempt.answers)
    const totalPoints = selectedAttempt.totalPoints ?? sumQuestionPoints(selectedAttemptContext.questions)
    return {
      correct: totals.correct,
      total: totals.total,
      partialPoints: totals.points,
      totalPoints
    }
  }, [selectedAttemptContext, selectedAttempt])

  const finalPoints = useMemo(() => {
    if (!selectedAttempt) return null
    const total = selectedAttempt.totalPoints
    if (!total) return null
    if (typeof selectedAttempt.scorePoints === "number") {
      return Number(selectedAttempt.scorePoints.toFixed(1))
    }
    return Number(((selectedAttempt.scorePercent / 100) * total).toFixed(1))
  }, [selectedAttempt])

  const gradebook = useMemo(() => {
    if (!currentUser) return []

    return availableCourses.map((course) => ({
      course,
      modules: course.modules.map((module) => {
        const activities = module.exams.filter((item) => item.type === "activity")
        const rows = activities.map((item) => {
          const questions = item.questions || []
          const totalPoints = item.totalPoints ?? sumQuestionPoints(questions)
          const attempts = studentAttempts.filter(
            (attempt) =>
              attempt.courseId === course.id &&
              attempt.examId === item.id &&
              attempt.examType === "activity"
          )
          const lastAttempt = attempts.length ? attempts[attempts.length - 1] : null
          let earnedPoints = 0
          let statusLabel = "Sem envio"

          if (lastAttempt) {
            if (lastAttempt.status === "corrigido") {
              if (typeof lastAttempt.scorePoints === "number") {
                earnedPoints = Number(lastAttempt.scorePoints.toFixed(1))
              } else {
                earnedPoints = Number(((lastAttempt.scorePercent / 100) * totalPoints).toFixed(1))
              }
              statusLabel = lastAttempt.result === "apto" ? "Apto" : "Reprovado"
            } else {
              const partial = sumObjectivePoints(questions, lastAttempt.answers)
              earnedPoints = Number(partial.points.toFixed(1))
              statusLabel = "Pendente"
            }
          }

          return {
            id: item.id,
            title: item.title,
            earnedPoints,
            totalPoints,
            statusLabel
          }
        })

        return {
          id: module.id,
          name: module.name,
          rows
        }
      })
    }))
  }, [availableCourses, studentAttempts, currentUser])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handlePasswordChange = () => {
    setPasswordMessage("")
    if (!currentUser) return
    if (newPassword.length < 6) {
      setPasswordMessage("A senha deve ter no minimo 6 caracteres.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("As senhas nao coincidem.")
      return
    }
    alterarSenhaAluno(currentUser.id, newPassword)
    setNewPassword("")
    setConfirmPassword("")
    setPasswordMessage("Senha atualizada com sucesso.")
  }

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentUser) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== "string") return
      const kind = file.type.startsWith("image/") ? "image" : "pdf"
      adicionarDocumentoAluno(currentUser.id, {
        name: file.name,
        kind,
        fileUrl: reader.result
      })
    }
    reader.readAsDataURL(file)
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-sm text-[#6b7a5f]">Acesso nao autorizado.</p>
      </div>
    )
  }

  const documents = currentUser.documents || []
  const certificate = currentUser.certificate
  const certificateLabel = certificate?.fileUrl
    ? certificate.fileUrl.split("/").pop() || "Certificado"
    : "Certificado"

  return (
    <div className="min-h-screen bg-black text-white">
      <aside className="w-full border-b border-[#F4511E] bg-black md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-b-0 md:border-r">
        <div className="p-4 border-b border-[#F4511E]/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
              <Shield className="h-5 w-5 text-[#F4511E]" />
            </div>
            <div>
              <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Aluno</p>
              <p className="font-bold text-foreground truncate">{currentUser.name}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {(
            [
              { key: "cursos", label: "Cursos", icon: BookOpen },
              { key: "dados", label: "Meus Dados", icon: User },
              { key: "atividades", label: "Atividades", icon: ClipboardList },
              { key: "notas", label: "Notas", icon: FileText }
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`flex w-full items-center gap-3 border px-3 py-2 text-left text-xs uppercase tracking-wider transition-colors ${
                activeSection === item.key
                  ? "border-[#F4511E] bg-[#F4511E]/10 text-[#F4511E]"
                  : "border-border text-[#6b7a5f] hover:border-[#F4511E]/60 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#F4511E]/30">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 border border-[#6b7a5f] px-3 py-2 text-xs uppercase tracking-wider text-[#6b7a5f] hover:border-[#F4511E] hover:text-[#F4511E]"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      <div className="md:pl-64">
        <Header userName={currentUser.name} />

        <main className="p-4 md:p-6 space-y-6">
          {pendingCriticalNotice && currentUser && (
            <div className="sticky top-0 z-40 border border-[#F4511E] bg-[#F4511E]/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#F4511E]">Alerta Critico</p>
                  <p className="text-sm font-bold text-foreground">
                    {pendingCriticalNotice.title || "Comunicado"}
                  </p>
                  <p className="text-xs text-[#6b7a5f]">{pendingCriticalNotice.message}</p>
                </div>
                <Button
                  onClick={() => markAsRead(currentUser.id, pendingCriticalNotice.id)}
                  className="bg-[#F4511E] text-black rounded-none"
                >
                  Ciente
                </Button>
              </div>
            </div>
          )}
          {activeSection === "cursos" && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-foreground">Cursos Liberados</h1>
                  <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Grid de cursos ativos para o operador
                  </p>
                </div>
              </div>

              {availableCourses.length === 0 ? (
                <div className="border border-border bg-[#0a0a0a] p-6 text-sm text-[#6b7a5f]">
                  Nenhum curso liberado no momento.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {availableCourses.map((course) => (
                    <div key={course.id} className="border border-border bg-[#0a0a0a]">
                      <div className="border-b border-border p-4">
                        <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">{course.code}</p>
                        <h3 className="text-lg font-bold text-foreground">{course.name}</h3>
                        <p className="text-xs text-[#6b7a5f] mt-2">{course.totalHours}</p>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs text-[#6b7a5f]">
                          <span>{course.modules.length} modulos</span>
                          <span className="font-mono">ID {String(course.id).padStart(3, "0")}</span>
                        </div>
                        <Link
                          href={`/curso/${course.id}`}
                          className="flex items-center justify-between border border-[#F4511E] px-3 py-2 text-xs uppercase tracking-wider text-[#F4511E] hover:bg-[#F4511E] hover:text-black transition-colors"
                        >
                          Acessar curso
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeSection === "dados" && (
            <section className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-foreground">Meus Dados</h1>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Perfil e documentos do operador</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="border border-border bg-[#0a0a0a] p-4 space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#F4511E]">Dados Cadastrais</h2>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Nome</p>
                      <p className="text-foreground">{currentUser.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">CPF</p>
                      <p className="text-foreground font-mono">{currentUser.cpf || "Nao informado"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">ID</p>
                      <p className="text-foreground font-mono">{String(currentUser.id).padStart(4, "0")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Email</p>
                      <p className="text-foreground">{currentUser.email}</p>
                    </div>
                  </div>
                </div>

                <div className="border border-border bg-[#0a0a0a] p-4 space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#F4511E]">Upload de Documentos</h2>
                  <div className="space-y-3">
                    {documents.length === 0 ? (
                      <p className="text-xs text-[#6b7a5f]">Nenhum documento enviado.</p>
                    ) : (
                      documents.map((doc) => (
                        <DocumentRow key={doc.id} document={doc} />
                      ))
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={handleDocumentUpload}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-[#F4511E] text-black rounded-none"
                  >
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Enviar Documento
                  </Button>
                </div>

                <div className="border border-border bg-[#0a0a0a] p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-[#F4511E]" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#F4511E]">Certificado</h2>
                  </div>
                  {certificate ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <p className="text-[#6b7a5f] uppercase tracking-wider">Arquivo</p>
                        <p className="text-foreground break-all">{certificateLabel}</p>
                        <p className="text-[10px] text-[#6b7a5f]">Curso {certificate.courseId}</p>
                      </div>
                      <Button
                        asChild
                        className="bg-[#F4511E] text-black rounded-none"
                      >
                        <a href={certificate.fileUrl} download>
                          Baixar certificado
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-[#6b7a5f]">Aguardando upload do administrador.</p>
                  )}
                </div>
              </div>

              <div className="border border-border bg-[#0a0a0a] p-4 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#F4511E]">Seguranca</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    type="password"
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-border bg-black rounded-none text-sm"
                  />
                  <Input
                    type="password"
                    placeholder="Confirmar senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-border bg-black rounded-none text-sm"
                  />
                </div>
                {passwordMessage && (
                  <p className="text-xs text-[#F4511E]">{passwordMessage}</p>
                )}
                <Button
                  onClick={handlePasswordChange}
                  className="bg-[#F4511E] text-black rounded-none"
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Alterar senha
                </Button>
              </div>
            </section>
          )}

          {activeSection === "atividades" && (
            <section className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-foreground">Atividades</h1>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                  Historico de execucoes e revisao detalhada
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
                <div className="border border-border bg-[#0a0a0a]">
                  <div className="p-3 border-b border-border text-xs uppercase tracking-wider text-[#6b7a5f]">
                    Execucoes
                  </div>
                  <div className="divide-y divide-border">
                    {studentAttempts.length === 0 ? (
                      <div className="p-4 text-xs text-[#6b7a5f]">Nenhuma atividade enviada.</div>
                    ) : (
                      studentAttempts.map((attempt) => (
                        <button
                          key={attempt.id}
                          onClick={() => setSelectedAttemptId(attempt.id)}
                          className={`w-full text-left p-3 transition-colors ${
                            selectedAttemptId === attempt.id
                              ? "bg-[#F4511E]/10 border-l-2 border-[#F4511E]"
                              : "hover:bg-[#111111]"
                          }`}
                        >
                          <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">{attempt.examType}</p>
                          <p className="text-sm text-foreground font-medium">{attempt.title}</p>
                          <p className="text-[10px] text-[#6b7a5f]">{attempt.submittedAt}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="border border-border bg-[#0a0a0a] p-4 space-y-4">
                  {!selectedAttempt || !selectedAttemptContext ? (
                    <p className="text-xs text-[#6b7a5f]">Selecione uma atividade para revisar.</p>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2 border-b border-border pb-4">
                        <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">{selectedAttemptContext.courseName}</p>
                        <h2 className="text-lg font-bold text-foreground">{selectedAttemptContext.activityName}</h2>
                        {objectiveScore && (
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <div className="flex items-center gap-2 text-[#6b7a5f]">
                              <Target className="h-4 w-4 text-[#F4511E]" />
                              Acertos: {objectiveScore.correct}/{objectiveScore.total}
                            </div>
                            {selectedAttempt.hasEssay && selectedAttempt.status === "pendente" && (
                              <span className="text-[#F4511E] font-mono">
                                Parcial: {objectiveScore.partialPoints.toFixed(1)} / {objectiveScore.totalPoints.toFixed(1)}
                              </span>
                            )}
                            {selectedAttempt.status === "corrigido" && (
                              <span className="text-green-400 font-mono">
                                Nota final: {finalPoints?.toFixed(1) ?? "0.0"} / {objectiveScore.totalPoints.toFixed(1)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        {selectedAttemptContext.questions.map((question) => (
                          <div key={question.id} className="border border-border p-3">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#6b7a5f]">
                              <CircleDot className="h-3 w-3" />
                              Questao {question.id}
                            </div>
                            <p className="text-sm text-foreground mt-2">{question.prompt}</p>

                            {question.type === "multiple" ? (
                              <div className="mt-3 space-y-2">
                                {question.options?.map((option, index) => {
                                  const selected = selectedAttempt.answers[question.id] === index
                                  const correct = question.correctIndex === index
                                  const stateClass = selected
                                    ? correct
                                      ? "border-green-500 text-green-400"
                                      : "border-red-500 text-red-400"
                                    : correct
                                      ? "border-green-500 text-green-400"
                                      : "border-border text-[#6b7a5f]"
                                  return (
                                    <div key={index} className={`border px-3 py-2 text-xs ${stateClass}`}>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono">{String(index + 1).padStart(2, "0")}</span>
                                        <span>{option}</span>
                                        {selected && (
                                          <span className="ml-auto text-[10px] uppercase">Marcada</span>
                                        )}
                                        {correct && !selected && (
                                          <span className="ml-auto text-[10px] uppercase">Correta</span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="mt-3 border border-border p-3 text-xs text-[#6b7a5f]">
                                <p className="text-[10px] uppercase tracking-wider">Resposta dissertativa</p>
                                <p className="text-foreground mt-2">
                                  {String(selectedAttempt.answers[question.id] || "Sem resposta")}
                                </p>
                                {selectedAttempt.status === "pendente" && (
                                  <span className="text-[#F4511E] text-[10px] uppercase tracking-wider">
                                    Aguardando correcao do administrador
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeSection === "notas" && (
            <section className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-foreground">Notas</h1>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Boletim por modulos</p>
              </div>

              {gradebook.length === 0 ? (
                <div className="border border-border bg-[#0a0a0a] p-6 text-xs text-[#6b7a5f]">
                  Nenhum dado de notas disponivel.
                </div>
              ) : (
                <div className="space-y-6">
                  {gradebook.map((entry) => (
                    <div key={entry.course.id} className="border border-border bg-[#0a0a0a]">
                      <div className="border-b border-border p-4">
                        <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">{entry.course.code}</p>
                        <h2 className="text-lg font-bold text-foreground">{entry.course.name}</h2>
                      </div>

                      <div className="divide-y divide-border">
                        {entry.modules.map((module) => (
                          <div key={module.id} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-bold text-foreground">{module.name}</h3>
                              <span className="text-[10px] text-[#6b7a5f] uppercase tracking-wider font-mono">
                                MOD-{String(module.id).padStart(2, "0")}
                              </span>
                            </div>
                            {module.rows.length === 0 ? (
                              <p className="text-xs text-[#6b7a5f]">Sem atividades cadastradas.</p>
                            ) : (
                              <div className="space-y-2">
                                {module.rows.map((row) => (
                                  <div key={row.id} className="border border-border p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                      <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">{row.statusLabel}</p>
                                      <p className="text-sm text-foreground">{row.title}</p>
                                    </div>
                                    <div className="text-sm font-mono text-[#F4511E]">
                                      {row.earnedPoints.toFixed(1)} / {row.totalPoints.toFixed(1)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

function DocumentRow({ document }: { document: UserDocument }) {
  const status = document.status ?? "aguardando"
  const statusConfig =
    status === "validado"
      ? { label: "Validado", color: "text-green-400", icon: CheckCircle2 }
      : status === "recusado"
        ? { label: "Recusado", color: "text-red-400", icon: XCircle }
      : { label: "Aguardando Validacao", color: "text-[#F4511E]", icon: XCircle }
  const StatusIcon = statusConfig.icon

  return (
    <div className="border border-border p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">{document.name}</p>
        <p className="text-[10px] text-[#6b7a5f]">{document.uploadedAt}</p>
      </div>
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wider ${statusConfig.color}`}>
        <StatusIcon className="h-4 w-4" />
        {statusConfig.label}
      </div>
    </div>
  )
}
