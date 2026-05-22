"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  BookOpen,
  ClipboardCheck,
  Shield,
  Users
} from "lucide-react"
import { Header } from "@/components/header"

const navItems = [
  { href: "/admin?view=alunos", label: "Gestao de Alunos", icon: Users },
  { href: "/admin/cursos", label: "Gestao de Cursos", icon: BookOpen },
  { href: "/admin/revisao", label: "Central de Correcao", icon: ClipboardCheck }
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const viewParam = searchParams.get("view")

  return (
    <div className="min-h-screen bg-black text-white">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-[#F4511E] bg-black">
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

        <nav className="p-4 space-y-2">
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
      </aside>

      <div className="md:pl-64">
        <Header userName="Comandante Admin" isAdmin />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
