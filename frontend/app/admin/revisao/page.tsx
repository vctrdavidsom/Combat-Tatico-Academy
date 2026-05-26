"use client"

import { useEffect, useMemo, useState } from "react"
import { ClipboardCheck, User, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

type ApiExamLog = {
  id: number
  user_id: number
  exam_id: number
  course_id?: number | null
  module_id?: number | null
  has_essay: boolean
  status: "pendente" | "corrigido"
  submitted_at: string
}

type ApiUser = {
  id: number
  full_name: string
  email: string
  role: string
}

type ApiCourse = {
  id: number
  name: string
  code: string
}

type ApiExam = {
  id: number
  title: string
}

const API_BASE_URL = "/api"
const ACCESS_TOKEN_KEY = "cta_access_token"

export default function ReviewPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<ApiExamLog[]>([])
  const [users, setUsers] = useState<ApiUser[]>([])
  const [courses, setCourses] = useState<ApiCourse[]>([])
  const [examTitles, setExamTitles] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    const loadReviewData = async () => {
      setLoadError("")
      setIsLoading(true)
      try {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY)
        if (!token) {
          setLoadError("Token nao encontrado. Faca login novamente.")
          return
        }

        const [logsResponse, usersResponse, coursesResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/exams/admin/logs`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/users/admin`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/courses/admin/courses`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])

        const logsRaw = await logsResponse.text()
        const usersRaw = await usersResponse.text()
        const coursesRaw = await coursesResponse.text()

        if (!logsResponse.ok) {
          setLoadError(logsRaw || "Erro ao carregar atividades pendentes.")
          return
        }

        const logsData = logsRaw ? (JSON.parse(logsRaw) as ApiExamLog[]) : []
        const usersData = usersResponse.ok ? (usersRaw ? JSON.parse(usersRaw) : []) : []
        const coursesData = coursesResponse.ok ? (coursesRaw ? JSON.parse(coursesRaw) : []) : []

        setLogs(Array.isArray(logsData) ? logsData : [])
        setUsers(Array.isArray(usersData) ? usersData : [])
        setCourses(Array.isArray(coursesData) ? coursesData : [])

        const pendingExamIds = Array.from(
          new Set(
            (Array.isArray(logsData) ? logsData : [])
              .filter((log) => log.has_essay && log.status === "pendente")
              .map((log) => log.exam_id)
          )
        )

        if (pendingExamIds.length) {
          const examResponses = await Promise.all(
            pendingExamIds.map((examId) =>
              fetch(`${API_BASE_URL}/exams/admin/exams/${examId}`, {
                headers: { Authorization: `Bearer ${token}` }
              })
            )
          )
          const examMap: Record<number, string> = {}
          await Promise.all(
            examResponses.map(async (response, index) => {
              if (!response.ok) return
              const raw = await response.text()
              const data = raw ? (JSON.parse(raw) as ApiExam) : null
              if (data?.title) {
                examMap[pendingExamIds[index]] = data.title
              }
            })
          )
          setExamTitles(examMap)
        }
      } catch {
        setLoadError("Falha ao conectar com o servidor.")
      } finally {
        setIsLoading(false)
      }
    }

    loadReviewData()
  }, [])

  const pending = useMemo(
    () => logs.filter((attempt) => attempt.has_essay && attempt.status === "pendente"),
    [logs]
  )

  const resolveStudentName = (userId: number) =>
    users.find((student) => student.id === userId)?.full_name || "Aluno"

  const resolveCourseName = (courseId?: number | null) =>
    courses.find((course) => course.id === courseId)?.name || "Curso"

  return (
    <div className="space-y-6">
      <div className="border border-border bg-black p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
            <ClipboardCheck className="h-5 w-5 text-[#F4511E]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Central de Correcao</h1>
            <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
              Dissertativas pendentes para avaliacao
            </p>
          </div>
        </div>
      </div>

      <div className="border border-border bg-black p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
            Pendentes: {pending.length}
          </p>
        </div>
        {isLoading ? (
          <p className="text-xs text-[#6b7a5f]">Carregando pendencias...</p>
        ) : loadError ? (
          <p className="text-xs text-red-500">{loadError}</p>
        ) : pending.length === 0 ? (
          <p className="text-xs text-[#6b7a5f]">Nenhuma atividade pendente.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((attempt) => (
              <div key={attempt.id} className="border border-border p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                    {resolveCourseName(attempt.course_id)}
                  </p>
                  <p className="text-sm text-foreground font-medium">
                    {examTitles[attempt.exam_id] || `Atividade ${attempt.exam_id}`}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[#6b7a5f]">
                    <User className="h-3 w-3" />
                    {resolveStudentName(attempt.user_id)}
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/admin/aluno/${attempt.user_id}`)}
                  className="flex items-center gap-2 border border-[#F4511E] px-3 py-2 text-xs uppercase tracking-wider text-[#F4511E] hover:bg-[#F4511E] hover:text-black transition-colors"
                >
                  Abrir
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
