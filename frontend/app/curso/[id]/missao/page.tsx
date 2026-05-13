"use client"

import React, { useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import ExamContainer, { ExamQuestion, ExamResult } from "@/components/exam/ExamContainer"
import { Button } from "@/components/ui/button"
import { useCombatContext } from "@/contexts/CombatContext"

export default function MissionPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const { listaCursos, currentUser, enviarMissao, tentativasExames } = useCombatContext()
  const courseId = Number(params.id)
  const course = listaCursos.find((item) => item.id === courseId) || listaCursos[0]
  const type = searchParams.get("type") || "final"
  const moduleId = Number(searchParams.get("moduleId"))
  const itemId = Number(searchParams.get("itemId"))

  const mission = useMemo(() => {
    if (type === "final") {
      return {
        title: course.finalExam?.title || "Exame Final",
        questions: course.finalExam?.questions || [],
        durationMinutes: course.finalExam?.durationMinutes || 0,
        cutScore: course.finalExam?.cutScore || 0,
        attemptLimit: course.finalExam?.attemptLimit || 0,
        contentId: course.finalExam?.id,
        moduleId: undefined
      }
    }

    const module = course.modules.find((m) => m.id === moduleId)
    const item = module?.items.find((i) => i.id === itemId)
    if (!item || item.type !== "activity") {
      return null
    }

    return {
      title: item.title,
      questions: item.questions || [],
      durationMinutes: 0,
      cutScore: 0,
      attemptLimit: item.attemptLimit || 0,
      contentId: item.id,
      moduleId: module?.id
    }
  }, [course, type, moduleId, itemId])

  if (!mission) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-6">
        <div className="border border-border p-6 max-w-md w-full">
          <h1 className="text-lg font-bold">Missao nao encontrada</h1>
          <p className="text-sm text-[#6b7a5f] mt-2">Volte ao curso e tente novamente.</p>
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

  const attemptsUsed = currentUser
    ? tentativasExames.filter(
        (attempt) =>
          attempt.alunoId === currentUser.id &&
          attempt.courseId === course.id &&
          attempt.type === (type === "final" ? "exame" : "atividade") &&
          attempt.contentId === mission.contentId
      )
    : []

  const attemptLimitReached =
    mission.attemptLimit > 0 && attemptsUsed.length >= mission.attemptLimit

  if (attemptLimitReached) {
    return (
      <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-6">
        <div className="border border-border p-6 max-w-xl w-full space-y-4">
          <div>
            <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Tentativas esgotadas</p>
            <h1 className="text-xl font-bold text-foreground">{mission.title}</h1>
          </div>
          <p className="text-sm text-[#6b7a5f]">
            O limite de tentativas foi atingido. Contate o instrutor para nova liberacao.
          </p>
          <div className="space-y-2">
            {attemptsUsed.map((attempt) => (
              <div key={attempt.id} className="border border-border p-3">
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Tentativa {attempt.attemptNumber}</p>
                <p className="text-sm text-foreground">Resultado: {attempt.scorePercent}%</p>
                <p className="text-xs text-[#6b7a5f]">{attempt.submittedAt}</p>
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

  const handleFinish = (payload: ExamResult) => {
    if (!currentUser) {
      router.push("/dashboard")
      return
    }
    enviarMissao({
      alunoId: currentUser.id,
      courseId: course.id,
      contentId: mission.contentId,
      moduleId: mission.moduleId,
      title: mission.title,
      type: type === "final" ? "exame" : "atividade",
      answers: payload.answers,
      scorePercent: payload.scorePercent,
      scorePoints: payload.scorePoints,
      totalPoints: payload.totalPoints,
      hasEssay: payload.hasEssay,
      maxAttempts: mission.attemptLimit,
      cutScore: mission.cutScore
    })
    router.push("/dashboard?status=pendente")
  }

  return (
    <ExamContainer
      title={mission.title}
      questions={mission.questions as ExamQuestion[]}
      durationMinutes={mission.durationMinutes}
      onFinish={handleFinish}
      onExit={() => router.push(`/curso/${params.id}`)}
    />
  )
}
