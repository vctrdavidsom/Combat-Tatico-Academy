"use client"

import { useState } from "react"
import { ClipboardCheck, FileText, Target } from "lucide-react"
import { Header } from "@/components/header"
import { EssayReviewCard } from "@/components/admin/essay-review-card"
import { ExamAttemptLog } from "@/components/admin/exam-attempt-log"

interface EssayReviewItem {
  id: number
  studentName: string
  courseName: string
  question: string
  answer: string
  score: number
  feedback: string
  resolved: boolean
}

interface ExamAttemptItem {
  id: number
  studentName: string
  courseName: string
  examName: string
  score: number
  cutScore: number
  submittedAt: string
  durationMinutes: number
  results: { id: number; prompt: string; correct: boolean }[]
}

const initialEssays: EssayReviewItem[] = [
  {
    id: 1,
    studentName: "Joao Silva",
    courseName: "CQC-001",
    question: "Descreva a postura basica de cobertura.",
    answer: "Manter o eixo alinhado, joelhos flexionados e arma em posicao de pronto uso.",
    score: 0,
    feedback: "",
    resolved: false
  },
  {
    id: 2,
    studentName: "Maria Santos",
    courseName: "SSP-002",
    question: "Explique o protocolo de abordagem segura em ambiente fechado.",
    answer: "Primeiro isolar o setor, garantir cobertura e seguir o protocolo de verbalizacao.",
    score: 0,
    feedback: "",
    resolved: false
  }
]

const examAttempts: ExamAttemptItem[] = [
  {
    id: 1,
    studentName: "Ana Costa",
    courseName: "CQC-001",
    examName: "Exame Final de Certificacao",
    score: 82,
    cutScore: 70,
    submittedAt: "02/05/2026 09:42",
    durationMinutes: 58,
    results: [
      { id: 1, prompt: "Controle de setores", correct: true },
      { id: 2, prompt: "Comunicacao silenciosa", correct: false },
      { id: 3, prompt: "Entrada em dupla", correct: true }
    ]
  },
  {
    id: 2,
    studentName: "Pedro Ferreira",
    courseName: "ARM-003",
    examName: "Exame Final de Certificacao",
    score: 61,
    cutScore: 70,
    submittedAt: "01/05/2026 18:22",
    durationMinutes: 60,
    results: [
      { id: 1, prompt: "Limpeza de arma", correct: false },
      { id: 2, prompt: "Controle de municao", correct: false },
      { id: 3, prompt: "Registro de manutencao", correct: true }
    ]
  }
]

export default function ReviewPage() {
  const [essays, setEssays] = useState(initialEssays)

  const pendingEssays = essays.filter((essay) => !essay.resolved)

  const handleResolve = (id: number) => {
    setEssays((prev) =>
      prev.map((essay) =>
        essay.id === id ? { ...essay, resolved: true } : essay
      )
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userName="Instrutor Alpha" isAdmin />

      <main className="p-4 md:p-6 space-y-8">
        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
              <ClipboardCheck className="h-5 w-5 text-[#F4511E]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Central de Revisao de Atividades</h1>
              <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                Correcao de dissertativas e auditoria de exames
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#F4511E]" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Questoes dissertativas pendentes
            </h2>
            <span className="text-xs text-[#6b7a5f]">{pendingEssays.length} pendentes</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {pendingEssays.map((essay) => (
              <EssayReviewCard
                key={essay.id}
                studentName={essay.studentName}
                courseName={essay.courseName}
                question={essay.question}
                answer={essay.answer}
                score={essay.score}
                feedback={essay.feedback}
                onScoreChange={(value) =>
                  setEssays((prev) =>
                    prev.map((item) =>
                      item.id === essay.id ? { ...item, score: value } : item
                    )
                  )
                }
                onFeedbackChange={(value) =>
                  setEssays((prev) =>
                    prev.map((item) =>
                      item.id === essay.id ? { ...item, feedback: value } : item
                    )
                  )
                }
                onResolve={() => handleResolve(essay.id)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#F4511E]" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Log de tentativas de exame
            </h2>
          </div>
          <div className="grid gap-4">
            {examAttempts.map((attempt) => (
              <ExamAttemptLog
                key={attempt.id}
                studentName={attempt.studentName}
                courseName={attempt.courseName}
                examName={attempt.examName}
                score={attempt.score}
                cutScore={attempt.cutScore}
                submittedAt={attempt.submittedAt}
                durationMinutes={attempt.durationMinutes}
                results={attempt.results}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
