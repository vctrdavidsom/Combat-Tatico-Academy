"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Shield, 
  Menu, 
  X, 
  LogOut, 
  User, 
  Settings,
  Bell
} from "lucide-react"
import { NotificationCenter } from "@/components/notification-center"

interface HeaderProps {
  userName?: string
  isAdmin?: boolean
}

export function Header({ userName = "Operador", isAdmin = false }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    router.push("/")
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
            <Shield className="h-5 w-5 text-[#F4511E]" />
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

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          {isAdmin ? (
            <button className="relative p-2 text-[#6b7a5f] hover:text-foreground transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-[#F4511E] rounded-full" />
            </button>
          ) : (
            <NotificationCenter />
          )}
          {isAdmin && (
            <>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center bg-[#6b7a5f]/20 border border-[#6b7a5f]">
                  <User className="h-4 w-4 text-[#6b7a5f]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{userName}</p>
                  <p className="text-xs text-[#6b7a5f] uppercase">Administrador</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-[#6b7a5f] hover:text-[#F4511E] transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wider">Sair</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        {isAdmin ? (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        ) : (
          <div className="md:hidden">
            <NotificationCenter />
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {menuOpen && isAdmin && (
        <div className="md:hidden border-t border-border bg-secondary">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="flex h-10 w-10 items-center justify-center bg-[#6b7a5f]/20 border border-[#6b7a5f]">
                <User className="h-5 w-5 text-[#6b7a5f]" />
              </div>
              <div>
                <p className="font-medium text-foreground">{userName}</p>
                <p className="text-xs text-[#6b7a5f] uppercase">Administrador</p>
              </div>
            </div>

            <button className="flex items-center gap-3 w-full p-2 text-[#6b7a5f] hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="text-sm">Notificações</span>
            </button>

            <button className="flex items-center gap-3 w-full p-2 text-[#6b7a5f] hover:text-foreground">
              <Settings className="h-5 w-5" />
              <span className="text-sm">Configurações</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-2 text-[#F4511E]"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm">Sair do Sistema</span>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
