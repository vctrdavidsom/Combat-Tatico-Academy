"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Award,
  BookOpen,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  FileText,
  Target,
  UploadCloud,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import {
  useCombatContext,
  type Question
} from "@/contexts/CombatContext"

type AdminUser = {
  id: number
  full_name: string
  cpf: string
  birth_date?: string | null
  email: string
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  role: string
  is_active: boolean
}

export default function StudentAdminPage() {
  const API_BASE_URL = "/api"
  const ACCESS_TOKEN_KEY = "cta_access_token"
  const params = useParams()
  const router = useRouter()
  const studentId = Number(params.id)
  const {
    listaCursos,
    tentativasExames,
    liberarCurso,
    lancarNota,
    uploadCertificadoExterno,
    validarDocumentoAluno
  } = useCombatContext()

  const [studentInfo, setStudentInfo] = useState<AdminUser | null>(null)
  const [studentError, setStudentError] = useState("")
  const [isLoadingStudent, setIsLoadingStudent] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null)
  const [essayDrafts, setEssayDrafts] = useState<Record<number, { grade?: string; feedback?: string }>>({})

  useEffect(() => {
    if (!studentId) return
    setStudentError("")
    setIsLoadingStudent(true)

    const loadStudent = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY)
        if (!token) {
          setStudentInfo(null)
          setStudentError("Token nao encontrado. Faca login novamente.")
          return
        }

        const response = await fetch(`${API_BASE_URL}/users/admin/${studentId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const raw = await response.text()
        let data: AdminUser | { detail?: string } | null = null
        try {
          data = raw ? JSON.parse(raw) : null
        } catch {
          data = null
        }

        if (!response.ok) {
          const detail = (data as { detail?: unknown } | null)?.detail
          const message = Array.isArray(detail)
            ? detail.map((item) => (item as { msg?: string })?.msg || JSON.stringify(item)).join(" | ")
            : typeof detail === "string"
              ? detail
              : detail
                ? JSON.stringify(detail)
                : raw || "Aluno nao encontrado."
          setStudentInfo(null)
          setStudentError(message)
          return
        }

        const resolved = data as AdminUser
        if (resolved.role !== "STUDENT") {
          setStudentInfo(null)
          setStudentError("Aluno nao encontrado.")
          return
        }
        setStudentInfo(resolved)
      } catch {
        setStudentInfo(null)
        setStudentError("Falha ao conectar com o servidor.")
      } finally {
        setIsLoadingStudent(false)
      }
    }

    loadStudent()
  }, [studentId, API_BASE_URL, ACCESS_TOKEN_KEY])

  const studentAttempts = useMemo(() => {
    if (!studentInfo) return []
    return tentativasExames.filter((attempt) => attempt.userId === studentInfo.id)
  }, [tentativasExames, studentInfo])

  const selectedAttempt = useMemo(() => {
    if (!selectedAttemptId) return studentAttempts[0] || null
    return studentAttempts.find((attempt) => attempt.id === selectedAttemptId) || null
  }, [studentAttempts, selectedAttemptId])

  const buildAttemptContext = (attemptId: number) => {
    const attempt = studentAttempts.find((item) => item.id === attemptId)
    if (!attempt) return null
    const course = listaCursos.find((item) => item.id === attempt.courseId)
    if (!course) return null

    if (attempt.examType === "final") {
      return {
        courseName: course.name,
        moduleName: "Exame Final",
        activityName: course.finalExam?.title || attempt.title,
        questions: course.finalExam?.questions || []
      }
    }

    const module =
      course.modules.find((item) => item.id === attempt.moduleId) ||
      course.modules.find((item) => item.exams.some((exam) => exam.id === attempt.examId))
    const item = module?.exams.find((exam) => exam.id === attempt.examId)
    return {
      courseName: course.name,
      moduleName: module?.name,
      activityName: item?.title || attempt.title,
      questions: item?.questions || [],
      totalPoints: item?.totalPoints
    }
  }

  const sumQuestionPoints = (questions: Question[]) =>
    Number(questions.reduce((sum, question) => sum + (question.weight ?? 1), 0).toFixed(2))

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

  const gradebook = useMemo(() => {
    return listaCursos.map((course) => ({
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

        const moduleTotal = rows.reduce((sum, row) => sum + row.earnedPoints, 0)
        return {
          id: module.id,
          name: module.name,
          rows,
          moduleTotal: Number(moduleTotal.toFixed(1))
        }
      })
    }))
  }, [listaCursos, studentAttempts])

  const handleCertificateUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (!studentInfo) return
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== "string") return
      const certificateCourseId = listaCursos[0]?.id || 0
      uploadCertificadoExterno(studentInfo.id, {
        id: Date.now(),
        userId: studentInfo.id,
        courseId: certificateCourseId,
        fileUrl: reader.result
      })
    }
    reader.readAsDataURL(file)
  }

  const handleEssaySave = (attemptId: number, totalPoints: number) => {
    if (!studentInfo) return
    const draft = essayDrafts[attemptId]
    const points = Number(draft?.grade || 0)
    const percent = totalPoints > 0 ? Math.round((points / totalPoints) * 100) : 0
    const resolvedPoints = Number.isFinite(points)
      ? points
      : totalPoints > 0
        ? Number(((percent / 100) * totalPoints).toFixed(2))
        : 0
    lancarNota(studentInfo.id, attemptId, percent, draft?.feedback, resolvedPoints, totalPoints)
  }

  const documents = []
  const certificate = null
  const certificateLabel = certificate?.fileUrl
    ? certificate.fileUrl.split("/").pop() || "Certificado"
    : "Certificado"

  if (isLoadingStudent) {
    return (
      <div className="border border-border bg-black p-6 text-xs text-[#6b7a5f]">
        Carregando aluno...
      </div>
    )
  }

  if (studentError) {
    return (
      <div className="border border-border bg-black p-6 text-xs text-red-500">
        {studentError}
      </div>
    )
  }

  if (!studentInfo) {
    return (
      <div className="border border-border bg-black p-6 text-xs text-[#6b7a5f]">
        Aluno nao encontrado.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border border-border bg-black p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Operador</p>
            <h1 className="text-xl font-bold text-foreground">{studentInfo.full_name}</h1>
            <p className="text-xs text-[#6b7a5f]">{studentInfo.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-[#F4511E]">
              {studentInfo.is_active ? "ativo" : "inativo"}
            </span>
            <Button
              variant="outline"
              onClick={() => router.push("/admin")}
              className="border-border rounded-none text-xs"
            >
              Voltar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
        <section className="space-y-6">
          <div className="border border-border bg-black p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#F4511E]">Dados Cadastrais</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">CPF</p>
                <p className="font-mono text-foreground">{studentInfo.cpf || "Nao informado"}</p>
              </div>
              <div>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">ID</p>
                <p className="font-mono text-foreground">{String(studentInfo.id).padStart(4, "0")}</p>
              </div>
              <div>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Telefone</p>
                <p className="text-foreground">{studentInfo.phone || "--"}</p>
              </div>
            </div>
          </div>

          <div className="border border-border bg-black p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#F4511E]">Documentos</h2>
            <div className="mt-4 space-y-3">
              {documents.length === 0 ? (
                <p className="text-xs text-[#6b7a5f]">Nenhum documento enviado.</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="border border-border p-3 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[#6b7a5f] uppercase tracking-wider">{doc.name}</p>
                        <p className="text-[10px] text-[#6b7a5f]">{doc.uploadedAt}</p>
                      </div>
                      <span className="text-[#F4511E] uppercase tracking-wider">{doc.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => validarDocumentoAluno(studentInfo.id, doc.id, "validado")}
                        className="flex-1 bg-[#F4511E] text-black rounded-none text-xs"
                      >
                        Aprovar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => validarDocumentoAluno(studentInfo.id, doc.id, "recusado")}
                        className="flex-1 border-border rounded-none text-xs"
                      >
                        Recusar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border border-border bg-black p-4">
            <div className="flex items-center gap-2 text-[#F4511E]">
              <UploadCloud className="h-4 w-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Certificado Externo</h2>
            </div>
            {certificate ? (
              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <p className="text-[#6b7a5f] uppercase tracking-wider">Arquivo atual</p>
                  <p className="text-foreground break-all">{certificateLabel}</p>
                  <p className="text-[10px] text-[#6b7a5f]">Curso {certificate.courseId}</p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="border-border rounded-none"
                >
                  <a href={certificate.fileUrl} download>
                    Baixar certificado
                  </a>
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-xs text-[#6b7a5f]">Nenhum certificado enviado.</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={handleCertificateUpload}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 bg-[#F4511E] text-black rounded-none"
            >
              {certificate ? "Atualizar certificado" : "Upload de certificado"}
            </Button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="border border-border bg-black">
            <div className="p-3 border-b border-border text-xs uppercase tracking-wider text-[#6b7a5f]">
              Cursos liberados
            </div>
            <div className="divide-y divide-border">
              {listaCursos.map((course) => {
                const isEnabled = false
                return (
                  <div key={course.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">{course.code}</p>
                      <p className="text-sm text-foreground">{course.name}</p>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => liberarCurso(studentInfo.id, course.id)}
                      className="data-[state=checked]:bg-[#F4511E]"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border border-border bg-black p-4">
            <div className="flex items-center gap-2 text-[#F4511E]">
              <ClipboardList className="h-4 w-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Central de Correcao</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_2fr] mt-4">
              <div className="border border-border">
                <div className="p-2 text-[10px] uppercase tracking-wider text-[#6b7a5f] border-b border-border">
                  Atividades
                </div>
                <div className="divide-y divide-border">
                  {studentAttempts.length === 0 ? (
                    <div className="p-3 text-xs text-[#6b7a5f]">Sem atividades.</div>
                  ) : (
                    studentAttempts.map((attempt) => (
                      <button
                        key={attempt.id}
                        onClick={() => setSelectedAttemptId(attempt.id)}
                        className={`w-full text-left p-3 text-xs ${
                          selectedAttempt?.id === attempt.id
                            ? "bg-[#F4511E]/10 border-l-2 border-[#F4511E]"
                            : "hover:bg-[#111111]"
                        }`}
                      >
                        <p className="text-[10px] text-[#6b7a5f] uppercase tracking-wider">{attempt.examType}</p>
                        <p className="text-sm text-foreground font-medium">{attempt.title}</p>
                        <p className="text-[10px] text-[#6b7a5f]">{attempt.submittedAt}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="border border-border p-3">
                {!selectedAttempt ? (
                  <p className="text-xs text-[#6b7a5f]">Selecione uma atividade para revisar.</p>
                ) : (
                  <AttemptReview
                    attempt={selectedAttempt}
                    context={buildAttemptContext(selectedAttempt.id)}
                    draft={essayDrafts[selectedAttempt.id]}
                    onDraftChange={(patch) =>
                      setEssayDrafts((prev) => ({
                        ...prev,
                        [selectedAttempt.id]: { ...prev[selectedAttempt.id], ...patch }
                      }))
                    }
                    onSave={(totalPoints) => handleEssaySave(selectedAttempt.id, totalPoints)}
                    sumObjectivePoints={sumObjectivePoints}
                    sumQuestionPoints={sumQuestionPoints}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="border border-border bg-black p-4">
            <div className="flex items-center gap-2 text-[#F4511E]">
              <BookOpen className="h-4 w-4" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Boletim por Modulos</h2>
            </div>
            <div className="mt-4 space-y-4">
              {gradebook.map((entry) => (
                <div key={entry.course.id} className="border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">{entry.course.code}</p>
                      <p className="text-sm text-foreground">{entry.course.name}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-3">
                    {entry.modules.map((module) => (
                      <div key={module.id} className="border border-border p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-foreground font-medium">{module.name}</p>
                          <span className="text-xs font-mono text-[#F4511E]">
                            Total: {module.moduleTotal.toFixed(1)}
                          </span>
                        </div>
                        <div className="mt-2 space-y-2">
                          {module.rows.map((row) => (
                            <div key={row.id} className="flex items-center justify-between text-xs border border-border p-2">
                              <div>
                                <p className="text-[10px] text-[#6b7a5f] uppercase tracking-wider">{row.statusLabel}</p>
                                <p className="text-sm text-foreground">{row.title}</p>
                              </div>
                              <span className="text-[#F4511E] font-mono">
                                {row.earnedPoints.toFixed(1)} / {row.totalPoints.toFixed(1)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

    </div>
  )
}

type AttemptReviewProps = {
  attempt: {
    id: number
    answers: Record<number, string | number>
    hasEssay: boolean
    status: "pendente" | "corrigido"
    scorePercent: number
    scorePoints?: number
    totalPoints?: number
  }
  context: {
    courseName: string
    moduleName?: string
    activityName: string
    questions: Question[]
    totalPoints?: number
  } | null
  draft?: { grade?: string; feedback?: string }
  onDraftChange: (patch: { grade?: string; feedback?: string }) => void
  onSave: (totalPoints: number) => void
  sumObjectivePoints: (questions: Question[], answers: Record<number, string | number>) => { correct: number; total: number; points: number }
  sumQuestionPoints: (questions: Question[]) => number
}

function AttemptReview({
  attempt,
  context,
  draft,
  onDraftChange,
  onSave,
  sumObjectivePoints,
  sumQuestionPoints
}: AttemptReviewProps) {
  if (!context) {
    return <p className="text-xs text-[#6b7a5f]">Dados da atividade indisponiveis.</p>
  }

  const totalPoints = context.totalPoints ?? attempt.totalPoints ?? sumQuestionPoints(context.questions)
  const objective = sumObjectivePoints(context.questions, attempt.answers)
  const currentPoints =
    typeof attempt.scorePoints === "number"
      ? attempt.scorePoints
      : Number(((attempt.scorePercent / 100) * totalPoints).toFixed(1))

  return (
    <div className="space-y-4">
      <div className="border-b border-border pb-3">
        <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">{context.courseName}</p>
        <h3 className="text-sm text-foreground font-bold">{context.activityName}</h3>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#6b7a5f]">
          <span>Acertos: {objective.correct}/{objective.total}</span>
          {attempt.status === "pendente" ? (
            <span className="text-[#F4511E] font-mono">
              Parcial: {objective.points.toFixed(1)} / {totalPoints.toFixed(1)}
            </span>
          ) : (
            <span className="text-green-400 font-mono">
              Nota final: {currentPoints.toFixed(1)} / {totalPoints.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {context.questions.map((question) => (
          <div key={question.id} className="border border-border p-3">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#6b7a5f]">
              <CircleDot className="h-3 w-3" /> Questao {question.id}
            </div>
            <p className="text-sm text-foreground mt-2">{question.prompt}</p>

            {question.type === "multiple" ? (
              <div className="mt-3 space-y-2">
                {(question.options || []).map((option, index) => {
                  const selected = attempt.answers[question.id] === index
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
                  {String(attempt.answers[question.id] || "Sem resposta")}
                </p>
                {attempt.status === "pendente" && (
                  <span className="text-[#F4511E] text-[10px] uppercase tracking-wider">
                    Aguardando correcao do administrador
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {attempt.hasEssay && attempt.status === "pendente" && (
        <div className="border border-border p-3 space-y-3">
          <div className="flex items-center gap-2 text-[#F4511E]">
            <Target className="h-4 w-4" />
            <h4 className="text-xs uppercase tracking-wider">Lancar nota</h4>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
            <Input
              type="number"
              min={0}
              step="0.1"
              value={draft?.grade || ""}
              onChange={(event) => onDraftChange({ grade: event.target.value })}
              className="border-border bg-black rounded-none text-sm"
              placeholder={`0 - ${totalPoints.toFixed(1)}`}
            />
            <Input
              value={draft?.feedback || ""}
              onChange={(event) => onDraftChange({ feedback: event.target.value })}
              className="border-border bg-black rounded-none text-sm"
              placeholder="Feedback do instrutor"
            />
          </div>
          <Button
            onClick={() => onSave(totalPoints)}
            className="bg-[#F4511E] text-black rounded-none"
          >
            Salvar correcao
          </Button>
        </div>
      )}
    </div>
  )
}

