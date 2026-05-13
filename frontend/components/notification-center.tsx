"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, ChevronRight, X } from "lucide-react"
import {
  useCombatContext,
  type NotificationItem,
  type NotificationType
} from "@/contexts/CombatContext"

const typeLabels: Record<NotificationType, string> = {
  AULA_NOVA: "Aula nova",
  ATIVIDADE_CORRIGIDA: "Atividade corrigida",
  NOVA_ATIVIDADE: "Nova atividade",
  BROADCAST_GERAL: "Comunicado"
}

export function NotificationCenter() {
  const router = useRouter()
  const { currentUser, markAsRead } = useCombatContext()
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<NotificationItem | null>(null)
  const [lastSeenId, setLastSeenId] = useState<number | null>(null)

  const notifications = currentUser?.notifications ?? []
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.lida).length,
    [notifications]
  )

  useEffect(() => {
    if (!notifications.length) return
    const latestId = Math.max(0, ...notifications.map((item) => item.id))
    if (lastSeenId === null) {
      setLastSeenId(latestId)
      return
    }
    if (latestId <= lastSeenId) return
    const newest = notifications.find((item) => item.id === latestId)
    if (!newest) return
    setToast(newest)
    setLastSeenId(latestId)
    const timeout = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timeout)
  }, [notifications, lastSeenId])

  const handleClick = (item: NotificationItem) => {
    if (!currentUser) return
    if (!item.lida) {
      markAsRead(currentUser.id, item.id)
    }
    setOpen(false)
    router.push(item.rota)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 text-[#6b7a5f] hover:text-foreground transition-colors"
        aria-label="Abrir notificacoes"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] rounded-full bg-[#F4511E] px-1.5 py-0.5 text-[10px] font-mono text-black">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] border border-[#F4511E] bg-black shadow-lg z-50">
          <div className="flex items-center justify-between border-b border-[#F4511E]/40 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#6b7a5f]">
                Centro de Notificacoes
              </p>
              <p className="text-sm font-bold text-foreground">
                Alertas Taticos
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-[#6b7a5f] hover:text-foreground"
              aria-label="Fechar notificacoes"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 text-xs text-[#6b7a5f]">
              Nenhuma notificacao registrada.
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleClick(item)}
                  className={`w-full text-left border-b border-border px-4 py-3 transition-colors hover:bg-[#111111] ${
                    item.lida ? "opacity-70" : "bg-[#0a0a0a]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-mono text-[#F4511E]">
                      {typeLabels[item.tipo]}
                    </span>
                    <span className="text-[10px] font-mono text-[#6b7a5f]">
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-foreground mt-1">
                    {item.mensagem}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#6b7a5f]">
                    <span>{item.lida ? "Lida" : "Nova"}</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 border border-[#F4511E] bg-black px-4 py-3 shadow-lg animate-[slide-in_0.2s_ease-out]">
          <p className="text-[10px] uppercase tracking-wider font-mono text-[#F4511E]">
            {typeLabels[toast.tipo]}
          </p>
          <p className="text-xs text-foreground mt-1">{toast.mensagem}</p>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(16px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
