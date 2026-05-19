"use client"

import { useMemo, useState } from "react"
import { Megaphone, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCombatContext } from "@/contexts/CombatContext"

export default function BroadcastPage() {
  const { listaAlunos, criarAviso } = useCombatContext()
  const [draft, setDraft] = useState({
    title: "",
    message: "",
    priority: "info" as const
  })

  const globalNotices = useMemo(() => {
    const map = new Map<number, { id: number; title?: string; message: string; severity: string; createdAt: string }>()
    listaAlunos.forEach((student) => {
      student.notifications
        .filter((notice) => notice.scope === "global")
        .forEach((notice) => {
          if (!map.has(notice.id)) {
            map.set(notice.id, {
              id: notice.id,
              title: notice.title,
              message: notice.message,
              severity: notice.severity,
              createdAt: notice.createdAt
            })
          }
        })
    })
    return Array.from(map.values()).sort((a, b) => b.id - a.id)
  }, [listaAlunos])

  const handleSend = () => {
    if (!draft.title || !draft.message) {
      return
    }

    criarAviso({
      title: draft.title,
      message: draft.message,
      priority: draft.priority
    })
    setDraft({ title: "", message: "", priority: "info" })
  }

  return (
    <div className="space-y-6">
        <div className="border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
              <Megaphone className="h-5 w-5 text-[#F4511E]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Broadcast Operacional</h1>
              <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                Avisos gerais para todos os alunos
              </p>
            </div>
          </div>
        </div>

        <div className="border border-border bg-card p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_160px]">
            <Input
              placeholder="Titulo do aviso"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="border-border bg-secondary rounded-none"
            />
            <select
              value={draft.priority}
              onChange={(e) => setDraft({ ...draft, priority: e.target.value as "info" | "critical" })}
              className="border border-border bg-secondary text-xs uppercase tracking-wider rounded-none px-2 py-2 text-[#6b7a5f]"
            >
                <option value="info">Informativo</option>
                <option value="critical">Critico</option>
            </select>
          </div>
          <Textarea
            placeholder="Mensagem operacional"
            value={draft.message}
            onChange={(e) => setDraft({ ...draft, message: e.target.value })}
            className="border-border bg-secondary rounded-none min-h-[120px] resize-none"
          />
          <Button
            onClick={handleSend}
            className="bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none w-full sm:w-auto"
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar Aviso
          </Button>
        </div>

        <div className="grid gap-4">
          {globalNotices.map((notice) => (
            <div key={notice.id} className="border border-border bg-card p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">{notice.title || "Comunicado"}</p>
                  <p className="text-xs text-[#6b7a5f]">{notice.message}</p>
                </div>
                <div className="text-right text-xs text-[#6b7a5f]">
                  <p className="uppercase tracking-wider">{notice.severity}</p>
                  <p>{notice.createdAt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
    </div>
  )
}
