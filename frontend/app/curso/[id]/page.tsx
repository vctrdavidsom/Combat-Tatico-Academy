"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  Play,
  Download,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  User
} from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCombatContext } from "@/contexts/CombatContext"

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
  draw_count: number
  attempt_limit: number
  total_points?: number | null
  cut_score?: number | null
  duration_minutes?: number | null
  start_date?: string | null
  due_date?: string | null
  questions: ApiQuestion[]
}

type ApiLesson = {
  id: number
  title: string
  type: "video" | "material"
  video_id?: string | null
  duration?: string | null
  material_pdf_url?: string | null
  material_link_url?: string | null
  order: number
}

type ApiModule = {
  id: number
  title: string
  description?: string | null
  order: number
  lessons: ApiLesson[]
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
  exam_id: number
  course_id?: number | null
}

type DebateMessage = {
  id: number
  lesson_id: number
  user_id: number
  user_name: string
  content: string
  created_at: string
  is_visible: boolean
}

type LibraryItem = {
  id: number
  title: string
  type: "pdf" | "link"
  url: string
  tags: string[]
  updated_at: string
}

const API_BASE_URL = "/api"
const ACCESS_TOKEN_KEY = "cta_access_token"

const toEmbedUrl = (videoId?: string | null) =>
  videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : ""

export default function CoursePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { currentUser } = useCombatContext()
  const courseId = Number(params.id)

  const [course, setCourse] = useState<ApiCourse | null>(null)
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([])
  const [examLogs, setExamLogs] = useState<ApiExamLog[]>([])
  const [expandedModule, setExpandedModule] = useState<number | null>(null)
  const [activeModuleIndex, setActiveModuleIndex] = useState(0)
  const [activeItemIndex, setActiveItemIndex] = useState(0)
  const [newComment, setNewComment] = useState("")
  const [debateMessages, setDebateMessages] = useState<DebateMessage[]>([])
  const [isLoadingDebate, setIsLoadingDebate] = useState(false)
  const [isSendingDebate, setIsSendingDebate] = useState(false)
  const [debateError, setDebateError] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState("")

  const buildModuleEntries = (module: ApiModule) => [
    ...module.lessons.map((lesson) => ({ kind: "lesson" as const, lesson })),
    ...module.exams.map((exam) => ({ kind: "exam" as const, exam }))
  ]

  const formatDateTime = (value?: string | null) => {
    if (!value) return ""
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleString("pt-BR")
  }

  const loadDebateMessages = useCallback(async (lessonId: number) => {
    setDebateError("")
    setIsLoadingDebate(true)
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setDebateError("Token nao encontrado. Faca login novamente.")
        setDebateMessages([])
        return
      }

      const response = await fetch(`${API_BASE_URL}/debates/student/lessons/${lessonId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const raw = await response.text()

      if (!response.ok) {
        setDebateError(raw || "Erro ao carregar debate.")
        setDebateMessages([])
        return
      }

      const data = raw ? JSON.parse(raw) : []
      setDebateMessages(Array.isArray(data) ? data : [])
    } catch {
      setDebateError("Falha ao carregar debate.")
      setDebateMessages([])
    } finally {
      setIsLoadingDebate(false)
    }
  }, [])

  useEffect(() => {
    if (!courseId) return

    const loadCourse = async () => {
      setLoadError("")
      setIsLoading(true)
      try {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY)
        if (!token) {
          setLoadError("Token nao encontrado. Faca login novamente.")
          setCourse(null)
          return
        }

        const [courseResponse, libraryResponse, logsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/courses/student/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/library/student/items`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/exams/student/logs`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])

        const courseRaw = await courseResponse.text()
        const libraryRaw = await libraryResponse.text()
        const logsRaw = await logsResponse.text()

        if (!courseResponse.ok) {
          setLoadError(courseRaw || "Erro ao carregar curso.")
          setCourse(null)
        } else {
          const courseData = courseRaw ? (JSON.parse(courseRaw) as ApiCourse) : null
          setCourse(courseData)
          if (courseData?.modules?.length) {
            setExpandedModule((prev) => prev ?? courseData.modules[0].id)
          }
        }

        if (libraryResponse.ok) {
          const libData = libraryRaw ? JSON.parse(libraryRaw) : []
          setLibraryItems(Array.isArray(libData) ? libData : [])
        }

        if (logsResponse.ok) {
          const logsData = logsRaw ? JSON.parse(logsRaw) : []
          setExamLogs(Array.isArray(logsData) ? logsData : [])
        }
      } catch {
        setLoadError("Falha ao conectar com o servidor.")
        setCourse(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadCourse()
  }, [courseId])

  useEffect(() => {
    if (!course?.modules?.length) return
    const moduleIdParam = Number(searchParams.get("moduleId"))
    const lessonIdParam = Number(searchParams.get("lessonId"))
    const examIdParam = Number(searchParams.get("examId"))
    if (!moduleIdParam || (!lessonIdParam && !examIdParam)) return
    const moduleIndex = course.modules.findIndex((module) => module.id === moduleIdParam)
    if (moduleIndex < 0) return
    const entries = buildModuleEntries(course.modules[moduleIndex])
    const itemIndex = entries.findIndex((entry) =>
      entry.kind === "lesson"
        ? entry.lesson.id === lessonIdParam
        : entry.exam.id === examIdParam
    )
    if (itemIndex < 0) return
    setExpandedModule(course.modules[moduleIndex].id)
    setActiveModuleIndex(moduleIndex)
    setActiveItemIndex(itemIndex)
    setIsPlaying(false)
  }, [searchParams, course])

  const activeModule = course?.modules?.[activeModuleIndex]
  const activeEntries = activeModule ? buildModuleEntries(activeModule) : []
  const activeEntry = activeEntries[activeItemIndex]
  const activeLesson = activeEntry?.kind === "lesson" ? activeEntry.lesson : null
  const activeExam = activeEntry?.kind === "exam" ? activeEntry.exam : null
  const isDebateDisabled = !activeLesson

  useEffect(() => {
    if (!activeLesson) {
      setDebateMessages([])
      setDebateError("")
      setNewComment("")
      return
    }

    loadDebateMessages(activeLesson.id)
    setNewComment("")
  }, [activeLesson?.id, loadDebateMessages])

  const handlePlay = () => setIsPlaying(true)

  const handleSendDebate = async () => {
    if (!activeLesson) {
      setDebateError("Debate disponivel apenas em aulas.")
      return
    }

    const content = newComment.trim()
    if (!content) {
      setDebateError("Digite uma mensagem antes de enviar.")
      return
    }

    setDebateError("")
    setIsSendingDebate(true)
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setDebateError("Token nao encontrado. Faca login novamente.")
        return
      }

      const response = await fetch(`${API_BASE_URL}/debates/student/lessons/${activeLesson.id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content })
      })

      const raw = await response.text()
      if (!response.ok) {
        setDebateError(raw || "Erro ao enviar mensagem.")
        return
      }

      const created = raw ? (JSON.parse(raw) as DebateMessage) : null
      if (created) {
        setDebateMessages((prev) => [created, ...prev])
      } else {
        await loadDebateMessages(activeLesson.id)
      }
      setNewComment("")
    } catch {
      setDebateError("Falha ao enviar mensagem.")
    } finally {
      setIsSendingDebate(false)
    }
  }

  const handleContentClick = (mi: number, ii: number) => {
    setActiveModuleIndex(mi)
    setActiveItemIndex(ii)
    setIsPlaying(false)
  }

  const startActivity = (moduleId: number, examId: number) => {
    router.push(`/curso/${courseId}/missao?type=activity&moduleId=${moduleId}&examId=${examId}`)
  }

  const countAttemptsForExam = (examId: number) =>
    examLogs.filter(
      (attempt) =>
        attempt.exam_id === examId &&
        (attempt.course_id == null || attempt.course_id === courseId)
    ).length

  const hasExhaustedAttempts = (exam: ApiExam) => {
    if (!exam.attempt_limit || exam.attempt_limit <= 0) return false
    return countAttemptsForExam(exam.id) >= exam.attempt_limit
  }

  const resolveExamWindow = (exam: ApiExam) => {
    const startDate = exam.start_date ? new Date(exam.start_date) : null
    const dueDate = exam.due_date ? new Date(exam.due_date) : null
    const startValid = startDate && !Number.isNaN(startDate.getTime()) ? startDate : null
    const dueValid = dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : null
    const now = new Date()
    if (startValid && now < startValid) {
      return {
        canStart: false,
        message: `Atividade liberada em ${startValid.toLocaleString("pt-BR")}`
      }
    }
    if (dueValid && now > dueValid) {
      return {
        canStart: false,
        message: `Atividade encerrada${dueValid ? ` em ${dueValid.toLocaleString("pt-BR")}` : ""}`
      }
    }
    return { canStart: true, message: "" }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header userName={currentUser?.name || "Operador"} />
        <main className="p-6">
          <p className="text-[#6b7a5f]">Carregando curso...</p>
        </main>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Header userName={currentUser?.name || "Operador"} />
        <main className="p-6">
          <p className="text-[#6b7a5f]">{loadError || "Curso nao encontrado."}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userName={currentUser?.name || "Operador Delta"} />

      <div className="flex flex-col lg:flex-row">
        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-1 text-[10px] text-[#6b7a5f] mb-4 sm:gap-2 sm:text-xs">
            <span>{course.code}</span>
            <span>/</span>
            <span>{course.name}</span>
            <span>/</span>
            <span className="text-[#F4511E]">{activeLesson?.title || activeExam?.title}</span>
          </div>

          {/* Player / Content */}
          <div className="relative bg-secondary border border-border mb-6">
            {!isPlaying && activeLesson?.type === "video" ? (
              <div className="aspect-video flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <h2 className="text-lg font-bold text-white mb-2 sm:text-xl">{activeLesson.title}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/70 sm:text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {activeLesson.duration || course.duration}
                    </span>
                  </div>
                </div>
                <button onClick={handlePlay} className="relative z-10 flex h-16 w-16 items-center justify-center border-2 border-[#F4511E] bg-[#F4511E] hover:scale-105 transition-transform sm:h-20 sm:w-20">
                  <Play className="h-8 w-8 text-white fill-white ml-1" />
                </button>
              </div>
            ) : activeLesson?.type === "video" ? (
              <div className="aspect-video">
                <iframe
                  src={toEmbedUrl(activeLesson.video_id)}
                  title={activeLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="p-6">
                {activeLesson?.type === "material" && (
                  <div>
                    <h3 className="font-medium mb-2">Materiais (Biblioteca Global)</h3>
                    {(activeLesson.material_pdf_url || activeLesson.material_link_url) && (
                      <p className="text-xs uppercase tracking-wider text-[#F4511E] mb-2">
                        Baixar conteudo
                      </p>
                    )}
                    <ul className="space-y-2">
                      {activeLesson.material_pdf_url && (
                        <li>
                          <a
                            href={activeLesson.material_pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary inline-flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" /> Baixar PDF
                          </a>
                        </li>
                      )}
                      {activeLesson.material_link_url && (
                        <li>
                          <a
                            href={activeLesson.material_link_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary inline-flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" /> Baixar conteudo
                          </a>
                        </li>
                      )}
                      {libraryItems.map((lib) => (
                        <li key={lib.id}>
                          <a
                            href={lib.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary inline-flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" /> {lib.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeExam && (
                  <div>
                    <p className="mb-2">Atividade: {activeExam.title}</p>
                    <p className="mb-2">Tentativas permitidas: {activeExam.attempt_limit}</p>
                    {(() => {
                      const availability = resolveExamWindow(activeExam)
                      const attemptsUsed = countAttemptsForExam(activeExam.id)
                      const attemptsExhausted = hasExhaustedAttempts(activeExam)
                      const canStart = availability.canStart && !attemptsExhausted
                      const message = attemptsExhausted
                        ? "Tentativas esgotadas."
                        : availability.message
                      return (
                        <>
                          <Button
                            onClick={() => startActivity(activeModule?.id || 0, activeExam.id)}
                            disabled={!canStart}
                          >
                            Iniciar Atividade
                          </Button>
                          {!canStart && message && (
                            <p className="text-xs text-[#F4511E] mt-2">{message}</p>
                          )}
                          {attemptsUsed > 0 && (
                            <p className="text-xs text-[#6b7a5f] mt-2">
                              Tentativas usadas: {attemptsUsed}/{activeExam.attempt_limit}
                            </p>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Download & Debate */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Button variant="outline" className="border-[#6b7a5f] text-[#6b7a5f] hover:bg-[#6b7a5f] hover:text-white rounded-none w-full justify-start whitespace-normal text-left sm:w-auto sm:justify-center sm:text-center">
              <FileText className="h-4 w-4 mr-2" />
              Download de Manual Tatico
              <Download className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" className="border-border text-[#6b7a5f] hover:bg-secondary rounded-none w-full justify-start whitespace-normal text-left sm:w-auto sm:justify-center sm:text-center">
              <FileText className="h-4 w-4 mr-2" />
              Material Complementar PDF
              <Download className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="border border-border bg-card">
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <MessageSquare className="h-5 w-5 text-[#F4511E]" />
              <h3 className="font-bold text-foreground uppercase tracking-wider">Debate Tecnico</h3>
            </div>
            <div className="p-4 border-b border-border">
              {isDebateDisabled ? (
                <p className="text-sm text-[#6b7a5f]">Debate disponivel apenas em aulas.</p>
              ) : (
                <div className="space-y-3">
                  {debateError && <p className="text-xs text-[#F4511E]">{debateError}</p>}
                  {isLoadingDebate ? (
                    <p className="text-sm text-[#6b7a5f]">Carregando debate...</p>
                  ) : debateMessages.length ? (
                    <ul className="space-y-3">
                      {debateMessages.map((message) => (
                        <li key={message.id} className="border border-border bg-secondary/30 p-3">
                          <div className="flex items-center justify-between text-xs text-[#6b7a5f] mb-2">
                            <span className="font-semibold text-foreground">{message.user_name}</span>
                            <span>{formatDateTime(message.created_at)}</span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-line">{message.content}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[#6b7a5f]">Seja o primeiro a iniciar o debate desta aula.</p>
                  )}
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-10 w-10 items-center justify-center bg-[#6b7a5f]/20 border border-[#6b7a5f] shrink-0">
                  <User className="h-5 w-5 text-[#6b7a5f]" />
                </div>
                <div className="flex-1 flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder={isDebateDisabled ? "Selecione uma aula para debater." : "Compartilhe sua analise tecnica..."}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isDebateDisabled || isSendingDebate}
                    className="flex-1 border-border bg-secondary rounded-none text-sm"
                  />
                  <Button
                    onClick={handleSendDebate}
                    disabled={isDebateDisabled || isSendingDebate || !newComment.trim()}
                    className="bg-[#F4511E] hover:bg-[#F4511E]/90 rounded-none px-4 w-full sm:w-auto"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar - Modules */}
        <aside className="w-full lg:w-96 border-t border-border bg-card lg:border-t-0 lg:border-l">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold text-foreground uppercase tracking-wider">Modulos do Curso</h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1 bg-secondary"><div className="h-full w-[45%] bg-[#F4511E]" /></div>
              <span className="text-xs text-[#6b7a5f]">45%</span>
            </div>
          </div>

          <div className="divide-y divide-border">
            {course.modules.map((module, mi) => (
              <div key={module.id}>
                <button onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)} className="flex items-center justify-between w-full p-3 text-left hover:bg-secondary/50 transition-colors sm:p-4">
                  <div>
                    <p className="font-medium text-foreground text-sm">{module.title}</p>
                    <p className="text-xs text-[#6b7a5f] mt-1">
                      {module.lessons.length + module.exams.length} itens
                    </p>
                  </div>
                  {expandedModule === module.id ? <ChevronUp className="h-5 w-5 text-[#6b7a5f]" /> : <ChevronDown className="h-5 w-5 text-[#6b7a5f]" />}
                </button>

                {expandedModule === module.id && (
                  <div className="bg-secondary/30">
                    {buildModuleEntries(module).map((entry, ii) => {
                      const isActive = ii === activeItemIndex && mi === activeModuleIndex
                      const title = entry.kind === "lesson" ? entry.lesson.title : entry.exam.title
                      const meta = entry.kind === "lesson" ? entry.lesson.duration || "" : "Atividade"
                      return (
                        <button
                          key={`${entry.kind}-${entry.kind === "lesson" ? entry.lesson.id : entry.exam.id}`}
                          onClick={() => handleContentClick(mi, ii)}
                          className={`flex items-center gap-3 w-full p-3 text-left border-l-2 transition-colors sm:p-4 ${
                            isActive ? "border-[#F4511E] bg-[#F4511E]/10" : "border-transparent hover:bg-secondary/50"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${isActive ? "text-[#F4511E] font-medium" : "text-foreground"}`}>{title}</p>
                            <p className="text-xs text-[#6b7a5f] mt-1">{meta}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
