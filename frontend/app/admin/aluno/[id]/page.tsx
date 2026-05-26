"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { BookOpen, CircleDot, ClipboardList, Target, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"

type ApiQuestion = {
  id: number
  type: "multiple" | "essay"
  prompt: string
  options?: string[]
  correct_index?: number | null
  weight?: number | null
}

type ApiExam = {
  id: number
  title: string
  type: "activity" | "final"
  attempt_limit: number
  total_points?: number | null
  questions: ApiQuestion[]
}

type ApiModule = {
  id: number
  title: string
  description?: string | null
  order: number
  exams: ApiExam[]
}

type ApiCourse = {
  id: number
  code: string
  name: string
  description: string
  duration: string
  thumbnail_url?: string | null
  is_active: boolean
  modules: ApiModule[]
  final_exam?: ApiExam | null
}

type ApiExamLog = {
  id: number
  user_id: number
  exam_id: number
  course_id?: number | null
  module_id?: number | null
  answers: Record<number, string | number>
  score_percent: number
  score_points?: number | null
  total_points?: number | null
  has_essay: boolean
  status: "pendente" | "corrigido"
  result: "apto" | "nao_apto"
  submitted_at: string
  attempt_number: number
  max_attempts?: number | null
  cut_score?: number | null
  feedback?: string | null
}

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
  const [studentInfo, setStudentInfo] = useState<AdminUser | null>(null)
  const [studentError, setStudentError] = useState("")
  const [isLoadingStudent, setIsLoadingStudent] = useState(false)
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null)
  const [courses, setCourses] = useState<ApiCourse[]>([])
  const [examLogs, setExamLogs] = useState<ApiExamLog[]>([])
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [dataError, setDataError] = useState("")
  const [essayDrafts, setEssayDrafts] = useState<Record<number, { grade?: string; feedback?: string }>>({})

  const readJsonResponse = async <T,>(response: Response) => {
    const raw = await response.text()
    if (!raw) {
      return { data: null as T | null, raw: "" }
    }
    try {
      return { data: JSON.parse(raw) as T, raw }
    } catch {
      return { data: null as T | null, raw }
    }
  }

  const resolveApiError = (raw: string, data: unknown, fallback: string) => {
    const detail = (data as { detail?: unknown } | null)?.detail
    if (Array.isArray(detail)) {
      return detail
        .map((item) => (item as { msg?: string })?.msg || JSON.stringify(item))
        .join(" | ")
    }
    if (typeof detail === "string") {
      return detail
    }
    if (detail) {
      return JSON.stringify(detail)
    }
    return raw || fallback
  }

  const formatDateTime = (value?: string | null) => {
    if (!value) return "--"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(date)
  }

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

  useEffect(() => {
    if (!studentId) return

    const loadData = async () => {
      setDataError("")
      setIsLoadingData(true)
      try {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY)
        if (!token) {
          setDataError("Token nao encontrado. Faca login novamente.")
          setCourses([])
          setExamLogs([])
          setEnrolledCourseIds([])
          return
        }

        const [coursesResponse, enrolledResponse, logsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/courses/admin/courses`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/users/admin/${studentId}/courses`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/exams/admin/logs?user_id=${studentId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])

        const coursesRaw = await coursesResponse.text()
        const enrolledRaw = await enrolledResponse.text()
        const logsRaw = await logsResponse.text()

        if (!coursesResponse.ok) {
          setDataError(coursesRaw || "Erro ao carregar cursos.")
          setCourses([])
        } else {
          const listData = coursesRaw ? JSON.parse(coursesRaw) : []
          const list = Array.isArray(listData) ? listData : []
          const detailResponses = await Promise.all(
            list.map((course: { id: number }) =>
              fetch(`${API_BASE_URL}/courses/admin/courses/${course.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              })
            )
          )
          const detailData = await Promise.all(
            detailResponses.map(async (res) => ({ ok: res.ok, raw: await res.text() }))
          )
          const detailed = detailData
            .filter((item) => item.ok)
            .map((item) => (item.raw ? JSON.parse(item.raw) : null))
            .filter(Boolean) as ApiCourse[]
          setCourses(detailed)
        }

        if (!enrolledResponse.ok) {
          setDataError((prev) => prev || enrolledRaw || "Erro ao carregar matriculas.")
          setEnrolledCourseIds([])
        } else {
          const enrolledData = enrolledRaw ? JSON.parse(enrolledRaw) : []
          setEnrolledCourseIds(Array.isArray(enrolledData) ? enrolledData : [])
        }

        if (!logsResponse.ok) {
          setDataError((prev) => prev || logsRaw || "Erro ao carregar atividades.")
          setExamLogs([])
        } else {
          const logsData = logsRaw ? JSON.parse(logsRaw) : []
          setExamLogs(Array.isArray(logsData) ? logsData : [])
        }
      } catch {
        setDataError("Falha ao conectar com o servidor.")
        setCourses([])
        setExamLogs([])
        setEnrolledCourseIds([])
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [studentId, API_BASE_URL, ACCESS_TOKEN_KEY])

  const studentAttempts = useMemo(() => {
    return [...examLogs].sort((a, b) => {
      const aTime = new Date(a.submitted_at).getTime()
      const bTime = new Date(b.submitted_at).getTime()
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return 0
      }
      return aTime - bTime
    })
  }, [examLogs])

  const selectedAttempt = useMemo(() => {
    if (!selectedAttemptId) return studentAttempts[0] || null
    return studentAttempts.find((attempt) => attempt.id === selectedAttemptId) || null
  }, [studentAttempts, selectedAttemptId])

  const buildAttemptContext = (attemptId: number) => {
    const attempt = studentAttempts.find((item) => item.id === attemptId)
    if (!attempt) return null
    const course = courses.find((item) => item.id === attempt.course_id)
    if (!course) return null

    if (course.final_exam && course.final_exam.id === attempt.exam_id) {
      return {
        courseName: course.name,
        moduleName: "Exame Final",
        activityName: course.final_exam.title,
        questions: course.final_exam.questions || [],
        totalPoints: course.final_exam.total_points
      }
    }

    const module =
      course.modules.find((item) => item.id === attempt.module_id) ||
      course.modules.find((item) => item.exams.some((exam) => exam.id === attempt.exam_id))
    const item = module?.exams.find((exam) => exam.id === attempt.exam_id)
    return {
      courseName: course.name,
      moduleName: module?.title,
      activityName: item?.title || "Atividade",
      questions: item?.questions || [],
      totalPoints: item?.total_points
    }
  }

  const sumQuestionPoints = (questions: ApiQuestion[]) =>
    Number(questions.reduce((sum, question) => sum + (question.weight ?? 1), 0).toFixed(2))

  const sumObjectivePoints = (questions: ApiQuestion[], answers: Record<number, string | number>) => {
    let correct = 0
    let total = 0
    let points = 0
    questions.forEach((question) => {
      if (question.type !== "multiple") return
      const weight = question.weight ?? 1
      total += 1
      const answerRaw = answers[question.id]
      const answerValue = typeof answerRaw === "string" ? Number(answerRaw) : answerRaw
      if (answerValue === question.correct_index) {
        correct += 1
        points += weight
      }
    })
    return { correct, total, points: Number(points.toFixed(2)) }
  }

  const gradebook = useMemo(() => {
    return courses.map((course) => ({
      course,
      modules: course.modules.map((module) => {
        const activities = module.exams.filter((item) => item.type === "activity")
        const rows = activities.map((item) => {
          const questions = item.questions || []
          const totalPoints = item.total_points ?? sumQuestionPoints(questions)
          const attempts = studentAttempts.filter(
            (attempt) => attempt.course_id === course.id && attempt.exam_id === item.id
          )
          const lastAttempt = attempts.length ? attempts[attempts.length - 1] : null
          let earnedPoints = 0
          let statusLabel = "Sem envio"

          if (lastAttempt) {
            if (lastAttempt.status === "corrigido") {
              if (typeof lastAttempt.score_points === "number") {
                earnedPoints = Number(lastAttempt.score_points.toFixed(1))
              } else {
                earnedPoints = Number(((lastAttempt.score_percent / 100) * totalPoints).toFixed(1))
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
          name: module.title,
          rows,
          moduleTotal: Number(moduleTotal.toFixed(1))
        }
      })
    }))
  }, [courses, studentAttempts])

  const handleCertificateUpload = () => {
    setDataError("Upload de certificado ainda nao esta disponivel.")
  }

  const handleEssaySave = async (attemptId: number, totalPoints: number) => {
    if (!studentInfo) return
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!token) {
      setDataError("Token nao encontrado. Faca login novamente.")
      return
    }

    const draft = essayDrafts[attemptId]
    const rawPoints = Number(draft?.grade || 0)
    const safePoints = Number.isFinite(rawPoints) ? rawPoints : 0
    const clampedPoints = Math.max(0, totalPoints > 0 ? Math.min(safePoints, totalPoints) : safePoints)
    const percent = totalPoints > 0 ? Math.round((clampedPoints / totalPoints) * 100) : 0
    const attempt = examLogs.find((item) => item.id === attemptId)
    const cutScore = attempt?.cut_score ?? 0
    const result = percent >= cutScore ? "apto" : "nao_apto"

    try {
      const payload = {
        score_percent: percent,
        score_points: Number(clampedPoints.toFixed(2)),
        total_points: totalPoints,
        status: "corrigido",
        result,
        feedback: draft?.feedback || null
      }
      const response = await fetch(`${API_BASE_URL}/exams/admin/logs/${attemptId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      const { data, raw } = await readJsonResponse<ApiExamLog>(response)
      if (!response.ok) {
        setDataError(resolveApiError(raw, data, "Falha ao salvar correcao."))
        return
      }

      if (data) {
        setExamLogs((prev) => prev.map((item) => (item.id === attemptId ? data : item)))
      }
      setEssayDrafts((prev) => ({
        ...prev,
        [attemptId]: { grade: "", feedback: "" }
      }))
    } catch {
      setDataError("Falha ao conectar com o servidor.")
    }
  }

  const handleCourseToggle = async (courseId: number) => {
    if (!studentInfo) return
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!token) {
      setDataError("Token nao encontrado. Faca login novamente.")
      return
    }

    const previousIds = enrolledCourseIds
    const nextIds = previousIds.includes(courseId)
      ? previousIds.filter((id) => id !== courseId)
      : [...previousIds, courseId]

    setEnrolledCourseIds(nextIds)

    try {
      const response = await fetch(`${API_BASE_URL}/users/admin/${studentId}/courses/sync`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ course_ids: nextIds })
      })

      const { data, raw } = await readJsonResponse<{ message?: string }>(response)
      if (!response.ok) {
        setDataError(resolveApiError(raw, data, "Falha ao atualizar cursos."))
        setEnrolledCourseIds(previousIds)
      }
    } catch {
      setDataError("Falha ao conectar com o servidor.")
      setEnrolledCourseIds(previousIds)
    }
  }

  const documents: Array<{ id: number; name: string; uploadedAt: string; status: string }> = []
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

      {isLoadingData && (
        <div className="border border-border bg-black p-3 text-xs text-[#6b7a5f]">
          Carregando cursos e atividades...
        </div>
      )}

      {dataError && (
        <div className="border border-border bg-black p-3 text-xs text-red-500">
          {dataError}
        </div>
      )}

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
                        disabled
                        className="flex-1 bg-[#F4511E] text-black rounded-none text-xs"
                      >
                        Aprovar
                      </Button>
                      <Button
                        variant="outline"
                        disabled
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
            <Button
              onClick={handleCertificateUpload}
              className="mt-4 bg-[#F4511E] text-black rounded-none"
            >
              {certificate ? "Atualizar certificado" : "Upload de certificado"}
            </Button>
            <p className="mt-2 text-[10px] text-[#6b7a5f]">Integracao pendente com a API.</p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="border border-border bg-black">
            <div className="p-3 border-b border-border text-xs uppercase tracking-wider text-[#6b7a5f]">
              Cursos liberados
            </div>
            <div className="divide-y divide-border">
              {courses.length === 0 ? (
                <div className="p-3 text-xs text-[#6b7a5f]">Nenhum curso cadastrado.</div>
              ) : (
                courses.map((course) => {
                  const isEnabled = enrolledCourseIds.includes(course.id)
                  return (
                    <div key={course.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">{course.code}</p>
                        <p className="text-sm text-foreground">{course.name}</p>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => handleCourseToggle(course.id)}
                        className="data-[state=checked]:bg-[#F4511E]"
                      />
                    </div>
                  )
                })
              )}
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
                        {(() => {
                          const context = buildAttemptContext(attempt.id)
                          const examType = context?.moduleName === "Exame Final" ? "final" : "atividade"
                          const title = context?.activityName || `Exame ${attempt.exam_id}`
                          return (
                            <>
                              <p className="text-[10px] text-[#6b7a5f] uppercase tracking-wider">{examType}</p>
                              <p className="text-sm text-foreground font-medium">{title}</p>
                              <p className="text-[10px] text-[#6b7a5f]">{formatDateTime(attempt.submitted_at)}</p>
                            </>
                          )
                        })()}
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
  attempt: ApiExamLog
  context: {
    courseName: string
    moduleName?: string
    activityName: string
    questions: ApiQuestion[]
    totalPoints?: number
  } | null
  draft?: { grade?: string; feedback?: string }
  onDraftChange: (patch: { grade?: string; feedback?: string }) => void
  onSave: (totalPoints: number) => void
  sumObjectivePoints: (questions: ApiQuestion[], answers: Record<number, string | number>) => { correct: number; total: number; points: number }
  sumQuestionPoints: (questions: ApiQuestion[]) => number
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

  const totalPoints = context.totalPoints ?? attempt.total_points ?? sumQuestionPoints(context.questions)
  const objective = sumObjectivePoints(context.questions, attempt.answers)
  const currentPoints =
    typeof attempt.score_points === "number"
      ? attempt.score_points
      : Number(((attempt.score_percent / 100) * totalPoints).toFixed(1))

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
                  const rawAnswer = attempt.answers[question.id]
                  const selectedIndex = typeof rawAnswer === "string" ? Number(rawAnswer) : rawAnswer
                  const selected = selectedIndex === index
                  const correct = question.correct_index === index
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
                  {String(attempt.answers[question.id] ?? "Sem resposta")}
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

      {attempt.has_essay && attempt.status === "pendente" && (
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

