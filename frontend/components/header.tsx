"use client"

import Image from "next/image"
import Link from "next/link"
import { 
  Menu, 
  X, 
  Bell
} from "lucide-react"
import { NotificationCenter } from "@/components/notification-center"

interface HeaderProps {
  userName?: string
  isAdmin?: boolean
  showSidebarToggle?: boolean
  onToggleSidebar?: () => void
  sidebarOpen?: boolean
}

export function Header({
  userName = "Operador",
  isAdmin = false,
  showSidebarToggle = false,
  onToggleSidebar,
  sidebarOpen = false
}: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
            <Image
              src="/logo.png"
              alt="Combat Tático Academy"
              fill
              sizes="40px"
              className="object-contain p-1"
              priority
            />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-foreground tracking-wide">
              COMBAT TÁTICO ACADEMY
            </h1>
            <p className="text-xs text-[#6b7a5f] uppercase tracking-widest">
              {isAdmin ? "Painel Administrativo" : "Plataforma de Treinamento"}
            </p>
          </div>
        </Link>

        {/* Mobile / Global Actions */}
        <div className="flex items-center gap-2">
          {!isAdmin && <NotificationCenter />}
          {isAdmin && (
            <button className="relative p-2 text-[#6b7a5f] hover:text-foreground transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-[#F4511E] rounded-full" />
            </button>
          )}
          {showSidebarToggle && (
            <button
              onClick={onToggleSidebar}
              className="p-2 text-foreground"
              aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
