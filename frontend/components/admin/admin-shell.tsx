"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  BookOpen,
  ClipboardCheck,
  FolderOpen,
  Shield,
  Users,
  X
} from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const navItems = [
  { href: "/admin?view=alunos", label: "Gestao de Alunos", icon: Users },
  { href: "/admin/cursos", label: "Gestao de Cursos", icon: BookOpen },
  { href: "/admin/biblioteca", label: "Biblioteca Global", icon: FolderOpen },
  { href: "/admin/revisao", label: "Central de Correcao", icon: ClipboardCheck }
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const viewParam = searchParams.get("view")
  const [isRootAdmin, setIsRootAdmin] = useState(false)
  const [rootCheckError, setRootCheckError] = useState("")
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [createError, setCreateError] = useState("")
  const [createSuccess, setCreateSuccess] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false)
  const ACCESS_TOKEN_KEY = "cta_access_token"

  useEffect(() => {
    const checkRoot = async () => {
      setRootCheckError("")
      try {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY)
        if (!token) {
          setIsRootAdmin(false)
          return
        }

        const response = await fetch("/api/users/admin/root-check", {
          headers: { Authorization: `Bearer ${token}` }
        })

        const raw = await response.text()
        if (!response.ok) {
          setIsRootAdmin(false)
          setRootCheckError(raw || "Falha ao validar permissões.")
          return
        }

        let data: { is_root_admin?: boolean } | null = null
        try {
          data = raw ? (JSON.parse(raw) as { is_root_admin?: boolean }) : null
        } catch {
          data = null
        }
        setIsRootAdmin(Boolean(data?.is_root_admin))
      } catch {
        setIsRootAdmin(false)
        setRootCheckError("Falha ao validar permissões.")
      }
    }

    checkRoot()
  }, [])

  const isAdminEmail = useMemo(() => adminEmail.trim().toLowerCase().endsWith("@combat.admin"), [adminEmail])
  const isPasswordValid = adminPassword.length >= 6
  const isPasswordMatch = adminPassword === adminConfirmPassword
  const canCreateAdmin = adminName.trim() && isAdminEmail && isPasswordValid && isPasswordMatch && !isCreating

  const handleCreateAdmin = async () => {
    if (!canCreateAdmin) return

    setCreateError("")
    setCreateSuccess("")
    setIsCreating(true)

    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setCreateError("Token nao encontrado. Faca login novamente.")
        return
      }

      const response = await fetch("/api/users/admin/create-admin", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          full_name: adminName.trim(),
          email: adminEmail.trim(),
          password: adminPassword
        })
      })

      const raw = await response.text()
      if (!response.ok) {
        let parsed: { detail?: string } | null = null
        try {
          parsed = raw ? (JSON.parse(raw) as { detail?: string }) : null
        } catch {
          parsed = null
        }
        const message = parsed?.detail || raw || "Erro ao criar admin."
        setCreateError(message)
        return
      }

      setCreateSuccess("Admin criado com sucesso.")
      setAdminName("")
      setAdminEmail("")
      setAdminPassword("")
      setAdminConfirmPassword("")
    } catch {
      setCreateError("Falha ao conectar com o servidor.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-[#F4511E] bg-black flex flex-col">
        <div className="p-4 border-b border-[#F4511E]/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
              <Shield className="h-5 w-5 text-[#F4511E]" />
            </div>
            <div>
              <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Comando</p>
              <p className="font-bold text-foreground">Admin</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          {navItems.map((item) => {
            const active =
              item.href === "/admin?view=alunos"
                ? pathname === "/admin" && viewParam === "alunos"
                : pathname === item.href && viewParam !== "alunos"
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 border px-3 py-2 text-xs uppercase tracking-wider transition-colors ${
                  active
                    ? "border-[#F4511E] bg-[#F4511E]/10 text-[#F4511E]"
                    : "border-border text-[#6b7a5f] hover:border-[#F4511E]/60 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {isRootAdmin && (
          <div className="p-4 border-t border-[#F4511E]/30">
            <p className="text-xs text-[#6b7a5f] uppercase tracking-wider mb-3">
              Criar perfil de admin
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => setShowCreateAdminModal(true)}
                className="w-full bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none text-xs"
              >
                Criar admin
              </Button>
              {rootCheckError && !isRootAdmin && (
                <p className="text-[10px] text-red-500">{rootCheckError}</p>
              )}
            </div>
          </div>
        )}
      </aside>

      <div className="md:pl-64">
        <Header userName="Comandante Admin" isAdmin />
        <main className="p-4 md:p-6">{children}</main>
      </div>

      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Admin</p>
                <h2 className="text-sm font-bold text-foreground">Criar perfil de admin</h2>
              </div>
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="text-[#6b7a5f] hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <Input
                placeholder="Nome completo"
                value={adminName}
                onChange={(event) => setAdminName(event.target.value)}
                className="border-border bg-secondary rounded-none text-xs"
              />
              <Input
                type="email"
                placeholder="email@combat.admin"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                className="border-border bg-secondary rounded-none text-xs"
              />
              <Input
                type="password"
                placeholder="Senha (mín. 6 caracteres)"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                className="border-border bg-secondary rounded-none text-xs"
              />
              <Input
                type="password"
                placeholder="Confirmar senha"
                value={adminConfirmPassword}
                onChange={(event) => setAdminConfirmPassword(event.target.value)}
                className="border-border bg-secondary rounded-none text-xs"
              />
              {!isAdminEmail && adminEmail.trim() && (
                <p className="text-[10px] text-red-500">Use um e-mail @combat.admin</p>
              )}
              {!isPasswordValid && adminPassword && (
                <p className="text-[10px] text-red-500">A senha deve ter no mínimo 6 caracteres</p>
              )}
              {adminConfirmPassword && !isPasswordMatch && (
                <p className="text-[10px] text-red-500">As senhas não coincidem</p>
              )}
              {createError && (
                <p className="text-[10px] text-red-500">{createError}</p>
              )}
              {createSuccess && (
                <p className="text-[10px] text-green-500">{createSuccess}</p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setShowCreateAdminModal(false)}
                className="flex-1 border-border rounded-none text-xs"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateAdmin}
                disabled={!canCreateAdmin}
                className="flex-1 bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none text-xs"
              >
                {isCreating ? "Criando..." : "Criar admin"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
