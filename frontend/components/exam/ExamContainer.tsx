"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, LogOut, Timer } from "lucide-react"

export type ExamQuestionType = "multiple" | "essay"

export type ExamQuestion = {
  id: number
  type: ExamQuestionType
  prompt: string
  options?: string[]
  correctIndex?: number
  weight?: number
}

export type ExamResult = {
  scorePercent: number
  scorePoints: number
  totalPoints: number
  hasEssay: boolean
  answers: Record<number, string | number>
}

type ExamContainerProps = {
  title: string
  questions: ExamQuestion[]
  durationMinutes?: number
  onFinish: (result: ExamResult) => void
  onExit?: () => void
}

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.max(0, totalSeconds % 60)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export default function ExamContainer({
  title,
  questions,
  durationMinutes = 0,
  onFinish,
  onExit
}: ExamContainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string | number>>({})
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60)
  const finishedRef = useRef(false)

  useEffect(() => {
    setTimeLeft(durationMinutes * 60)
  }, [durationMinutes])

  const hasEssay = useMemo(
    () => questions.some((question) => question.type === "essay"),
    [questions]
  )

  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex]

  const isAnswered = (question: ExamQuestion) => {
    const value = answers[question.id]
    if (question.type === "essay") {
      return typeof value === "string" && value.trim().length > 0
    }
    return typeof value === "number"
  }

  const calculateScore = () => {
    let objectiveTotal = 0
    let totalPoints = 0
    let score = 0
    questions.forEach((question) => {
      const weight = question.weight ?? 1
      totalPoints += weight
      if (question.type === "multiple") {
        objectiveTotal += weight
        if (answers[question.id] === question.correctIndex) {
          score += weight
        }
      }
    })
    const scorePercent = objectiveTotal === 0 ? 0 : Math.round((score / objectiveTotal) * 100)
    return {
      scorePercent,
      scorePoints: Number(score.toFixed(2)),
      totalPoints: Number(totalPoints.toFixed(2))
    }
  }

  const finishExam = () => {
    if (finishedRef.current) return
    finishedRef.current = true
    const result = calculateScore()
    onFinish({
      scorePercent: result.scorePercent,
      scorePoints: result.scorePoints,
      totalPoints: result.totalPoints,
      hasEssay,
      answers
    })
  }

  useEffect(() => {
    if (!durationMinutes) return
    if (timeLeft <= 0) {
      finishExam()
      return
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, durationMinutes])

  const goPrev = () => setCurrentIndex((prev) => Math.max(0, prev - 1))
  const goNext = () => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))

  const isLast = currentIndex === totalQuestions - 1

  const getIndicatorClass = (index: number) => {
    const question = questions[index]
    const current = index === currentIndex
    const answered = isAnswered(question)
    if (current) {
      return "border-[#F4511E] text-[#F4511E]"
    }
    if (answered) {
      return "border-[#F4511E]/60 text-[#F4511E]/80"
    }
    return "border-border text-[#6b7a5f]"
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="flex min-h-screen">
        <aside className="w-24 sm:w-32 md:w-40 border-r border-border p-4 space-y-3">
          <div className="text-xs text-[#6b7a5f] uppercase tracking-wider">Indice</div>
          <div className="grid grid-cols-2 gap-2">
            {questions.map((question, index) => (
              <button
                key={question.id}
                onClick={() => setCurrentIndex(index)}
                className={`h-10 w-10 border ${getIndicatorClass(index)} transition-colors`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6">
          <div className="flex flex-col gap-4 border border-border bg-[#0b0b0b] p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Missao</p>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">{title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {durationMinutes > 0 && (
                  <div className="flex items-center gap-2 text-xs text-[#6b7a5f]">
                    <Timer className="h-4 w-4" />
                    Tempo restante: {formatTime(timeLeft)}
                  </div>
                )}
                {hasEssay && (
                  <span className="text-xs uppercase tracking-wider border border-[#F4511E] text-[#F4511E] px-2 py-1">
                    Avaliacao pendente
                  </span>
                )}
                {onExit && (
                  <Button
                    onClick={onExit}
                    variant="outline"
                    className="border-[#6b7a5f] text-[#6b7a5f] rounded-none"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 border border-border bg-black p-4">
              <div className="flex items-center justify-between text-xs text-[#6b7a5f]">
                <span>Pagina {currentIndex + 1} de {totalQuestions}</span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    className="bg-transparent border border-border text-[#6b7a5f] rounded-none"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Pagina anterior
                  </Button>
                  <Button
                    onClick={isLast ? finishExam : goNext}
                    className="bg-[#F4511E] hover:bg-[#F4511E]/90 rounded-none"
                  >
                    {isLast ? "Finalizar Missao" : "Proxima pagina"}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>

              {currentQuestion ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Pergunta {currentIndex + 1}</p>
                    <p className="text-base text-foreground">{currentQuestion.prompt}</p>
                  </div>

                  {currentQuestion.type === "multiple" && (
                    <div className="space-y-2">
                      {(currentQuestion.options || []).map((option, index) => (
                        <label
                          key={index}
                          className="flex items-center gap-3 border border-border p-3 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            checked={answers[currentQuestion.id] === index}
                            onChange={() =>
                              setAnswers((prev) => ({ ...prev, [currentQuestion.id]: index }))
                            }
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === "essay" && (
                    <textarea
                      value={(answers[currentQuestion.id] as string) || ""}
                      onChange={(event) =>
                        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: event.target.value }))
                      }
                      rows={6}
                      className="w-full border border-border bg-black p-3 text-sm"
                      placeholder="Digite sua resposta..."
                    />
                  )}
                </div>
              ) : (
                <div className="text-sm text-[#6b7a5f]">Nenhuma pergunta encontrada.</div>
              )}

              <div className="flex items-center justify-between text-xs text-[#6b7a5f]">
                <span>Pagina {currentIndex + 1} de {totalQuestions}</span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    className="bg-transparent border border-border text-[#6b7a5f] rounded-none"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Pagina anterior
                  </Button>
                  <Button
                    onClick={isLast ? finishExam : goNext}
                    className="bg-[#F4511E] hover:bg-[#F4511E]/90 rounded-none"
                  >
                    {isLast ? "Finalizar Missao" : "Proxima pagina"}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
