"use client"

import { useMemo } from "react"
import { Award, BarChart3, Crown, Shield } from "lucide-react"
import { useCombatContext } from "@/contexts/CombatContext"

export default function ReportsPage() {
  const { listaAlunos, listaCursos, tentativasExames } = useCombatContext()

  const stats = useMemo(() => {
    const totalAttempts = tentativasExames.length
    const approved = tentativasExames.filter((attempt) => attempt.result === "apto").length
    const approvalRate = totalAttempts ? Math.round((approved / totalAttempts) * 100) : 0
    const studentProgress = listaAlunos.map((student) => {
      const completed = Object.values(student.progress || {}).reduce(
        (acc, items) => acc + items.length,
        0
      )
      return {
        id: student.id,
        name: student.name,
        completed,
        attempts: tentativasExames.filter((attempt) => attempt.userId === student.id).length
      }
    })
    const ranking = [...studentProgress].sort((a, b) => b.completed - a.completed).slice(0, 5)
    return { totalAttempts, approvalRate, studentProgress, ranking }
  }, [listaAlunos, tentativasExames])

  return (
    <div className="space-y-6">
        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
              <BarChart3 className="h-5 w-5 text-[#F4511E]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Relatorios Operacionais</h1>
              <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                Progresso, aprovacao e ranking interno
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-border bg-card p-4">
            <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Taxa de aprovacao</p>
            <p className="text-3xl font-bold text-foreground">{stats.approvalRate}%</p>
            <p className="text-xs text-[#6b7a5f]">{stats.totalAttempts} tentativas analisadas</p>
          </div>
          <div className="border border-border bg-card p-4">
            <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Cursos ativos</p>
            <p className="text-3xl font-bold text-foreground">{listaCursos.length}</p>
            <p className="text-xs text-[#6b7a5f]">Cursos cadastrados no sistema</p>
          </div>
        </div>

        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-4 w-4 text-[#F4511E]" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Ranking de progresso
            </h2>
          </div>
          <div className="space-y-3">
            {stats.ranking.map((student, index) => (
              <div key={student.id} className="flex items-center justify-between border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center border border-[#F4511E] text-[#F4511E]">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{student.name}</p>
                    <p className="text-xs text-[#6b7a5f]">{student.completed} aulas concluidas</p>
                  </div>
                </div>
                <div className="text-xs text-[#6b7a5f]">{student.attempts} missoes</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-[#F4511E]" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Progresso por aluno
            </h2>
          </div>
          <div className="space-y-3">
            {stats.studentProgress.map((student) => (
              <div key={student.id} className="border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-foreground">{student.name}</p>
                  <span className="text-xs text-[#6b7a5f]">{student.completed} aulas</span>
                </div>
                <div className="mt-2 h-1 bg-secondary">
                  <div
                    className="h-full bg-[#F4511E]"
                    style={{ width: `${Math.min(100, student.completed * 10)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  )
}
