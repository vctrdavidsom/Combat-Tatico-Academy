"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import ExamContainer, { ExamQuestion, ExamResult } from "@/components/exam/ExamContainer"
import { Button } from "@/components/ui/button"
import { useCombatContext } from "@/contexts/CombatContext"

type ApiExamQuestion = {
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
  questions: ApiExamQuestion[]
}

type ApiCourse = {
  id: number
  final_exam?: ApiExam | null
}

type ApiExamLog = {
  id: number
  exam_id: number
  submitted_at: string
  score_percent: number
  attempt_number: number
}

const API_BASE_URL = "/api"
const ACCESS_TOKEN_KEY = "cta_access_token"

export default function MissionPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { currentUser } = useCombatContext()

  const courseId = Number(params.id)
  const type = searchParams.get("type") || "final"
  const moduleId = Number(searchParams.get("moduleId"))
  const examIdParam = Number(searchParams.get("examId"))

  const [exam, setExam] = useState<(ApiExam & { questions: ExamQuestion[] }) | null>(null)
  const [examLogs, setExamLogs] = useState<ApiExamLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    if (!courseId) return

    const loadExam = async () => {
      setIsLoading(true)
      setLoadError("")
      try {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY)
        if (!token) {
          setLoadError("Token nao encontrado. Faca login novamente.")
          return
        }

        let resolvedExamId = examIdParam
        if (type === "final" && !resolvedExamId) {
          const courseResponse = await fetch(`${API_BASE_URL}/courses/student/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const courseRaw = await courseResponse.text()
          if (!courseResponse.ok) {
            setLoadError(courseRaw || "Erro ao carregar curso.")
            return
          }
          const courseData = courseRaw ? (JSON.parse(courseRaw) as ApiCourse) : null
          resolvedExamId = courseData?.final_exam?.id || 0
        }

        if (!resolvedExamId) {
          setLoadError("Exame nao encontrado.")
          return
        }

        const [examResponse, logsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/exams/student/exams/${resolvedExamId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/exams/student/logs`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])

        const examRaw = await examResponse.text()
        const logsRaw = await logsResponse.text()

        if (!examResponse.ok) {
          setLoadError(examRaw || "Exame nao encontrado.")
          return
        }

        const examData = examRaw ? (JSON.parse(examRaw) as ApiExam) : null
        const normalizedQuestions = (examData?.questions || []).map((question) => ({
          id: question.id,
          type: question.type,
          prompt: question.prompt,
          options: question.options,
          correctIndex: question.correct_index ?? undefined,
          weight: question.weight
        }))
        const normalizedExam = examData
          ? ({ ...examData, questions: normalizedQuestions } as ApiExam & { questions: ExamQuestion[] })
          : null
        setExam(normalizedExam)

        if (logsResponse.ok) {
          const logsData = logsRaw ? JSON.parse(logsRaw) : []
          setExamLogs(Array.isArray(logsData) ? logsData : [])
        }
      } catch {
        setLoadError("Falha ao conectar com o servidor.")
      } finally {
        setIsLoading(false)
      }
    }

    loadExam()
  }, [courseId, type, examIdParam])

  const attemptsUsed = useMemo(() => {
    if (!exam) return []
    return examLogs.filter((attempt) => attempt.exam_id === exam.id)
  }, [examLogs, exam])

  const attemptLimitReached =
    exam?.attempt_limit && exam.attempt_limit > 0 && attemptsUsed.length >= exam.attempt_limit

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-6">
        <div className="border border-border p-6 max-w-md w-full">
          <h1 className="text-lg font-bold">Carregando missao...</h1>
        </div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-6">
        <div className="border border-border p-6 max-w-md w-full">
          <h1 className="text-lg font-bold">Missao nao encontrada</h1>
          <p className="text-sm text-[#6b7a5f] mt-2">{loadError || "Volte ao curso e tente novamente."}</p>
          <Button
            onClick={() => router.push(`/curso/${params.id}`)}
            className="mt-4 bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none"
          >
            Voltar ao Curso
          </Button>
        </div>
      </div>
    )
  }

  if (attemptLimitReached) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-6">
        <div className="border border-border p-6 max-w-xl w-full space-y-4">
          <div>
            <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Tentativas esgotadas</p>
            <h1 className="text-xl font-bold text-foreground">{exam.title}</h1>
          </div>
          <p className="text-sm text-[#6b7a5f]">
            O limite de tentativas foi atingido. Contate o instrutor para nova liberacao.
          </p>
          <div className="space-y-2">
            {attemptsUsed.map((attempt) => (
              <div key={attempt.id} className="border border-border p-3">
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Tentativa {attempt.attempt_number}</p>
                <p className="text-sm text-foreground">Resultado: {attempt.score_percent}%</p>
                <p className="text-xs text-[#6b7a5f]">{attempt.submitted_at}</p>
              </div>
            ))}
          </div>
          <Button
            onClick={() => router.push(`/curso/${params.id}`)}
            className="bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none"
          >
            Voltar ao Curso
          </Button>
        </div>
      </div>
    )
  }

  const handleFinish = async (payload: ExamResult) => {
    if (!currentUser) {
      router.push("/dashboard")
      return
    }

    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        router.push("/")
        return
      }

      await fetch(`${API_BASE_URL}/exams/student/exams/${exam.id}/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          answers: payload.answers,
          score_percent: payload.scorePercent,
          score_points: payload.scorePoints,
          total_points: payload.totalPoints,
          has_essay: payload.hasEssay,
          max_attempts: exam.attempt_limit,
          cut_score: exam.cut_score ?? 70
        })
      })
    } finally {
      router.push("/dashboard?status=pendente")
    }
  }

  return (
    <ExamContainer
      title={exam.title}
      questions={exam.questions}
      durationMinutes={exam.duration_minutes || 0}
      onFinish={handleFinish}
      onExit={() => router.push(`/curso/${params.id}`)}
    />
  )
}
