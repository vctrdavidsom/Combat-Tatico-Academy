"use client"

import { ClipboardCheck, User, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCombatContext } from "@/contexts/CombatContext"

export default function ReviewPage() {
  const router = useRouter()
  const { listaAlunos, listaCursos, tentativasExames } = useCombatContext()

  const pending = tentativasExames.filter(
    (attempt) => attempt.hasEssay && attempt.status === "pendente"
  )

  const resolveStudentName = (userId: number) =>
    listaAlunos.find((student) => student.id === userId)?.name || "Aluno"

  const resolveCourseName = (courseId: number) =>
    listaCursos.find((course) => course.id === courseId)?.name || "Curso"

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
        {pending.length === 0 ? (
          <p className="text-xs text-[#6b7a5f]">Nenhuma atividade pendente.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((attempt) => (
              <div key={attempt.id} className="border border-border p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">{resolveCourseName(attempt.courseId)}</p>
                  <p className="text-sm text-foreground font-medium">{attempt.title}</p>
                  <div className="flex items-center gap-2 text-xs text-[#6b7a5f]">
                    <User className="h-3 w-3" />
                    {resolveStudentName(attempt.userId)}
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/admin/aluno/${attempt.userId}`)}
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
