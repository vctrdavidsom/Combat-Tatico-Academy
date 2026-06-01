"use client"

import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, User, AlertTriangle, Eye, EyeOff, Mail, ArrowLeft, KeyRound, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ScreenState = "login" | "forgot-password" | "verify-code" | "new-password" | "success"

export default function LoginPage() {
  const API_BASE_URL = "/api"
  const ACCESS_TOKEN_KEY = "cta_access_token"
  const [screen, setScreen] = useState<ScreenState>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Recuperação de senha
  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  const router = useRouter()
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const body = new URLSearchParams({
        username: email,
        password
      }).toString()
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body
      })

      const raw = await response.text()
      let data: { access_token?: string; detail?: string } | null = null
      try {
        data = raw ? JSON.parse(raw) : null
      } catch {
        data = null
      }

      if (!response.ok) {
        const message = data?.detail || raw || "Credenciais invalidas."
        setError(message)
        setIsLoading(false)
        return
      }

      if (!data?.access_token) {
        setError("Resposta invalida do servidor.")
        setIsLoading(false)
        return
      }

      localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token)

      const profileResponse = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`
        }
      })

      const profileRaw = await profileResponse.text()
      let profile: { role?: string } | null = null
      try {
        profile = profileRaw ? JSON.parse(profileRaw) : null
      } catch {
        profile = null
      }

      if (!profileResponse.ok) {
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        const detail = (profile as { detail?: unknown } | null)?.detail
        const message = typeof detail === "string"
          ? detail
          : detail
            ? JSON.stringify(detail)
            : profileRaw || "Falha ao carregar perfil."
        setError(message)
        setIsLoading(false)
        return
      }

      const role = profile?.role
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cta-auth-changed"))
      }

      if (role === "ADMIN") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    } catch {
      setError("Falha ao conectar com o servidor.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    await new Promise(resolve => setTimeout(resolve, 1500))

    if (recoveryEmail) {
      setScreen("verify-code")
    } else {
      setError("INFORME O EMAIL")
    }

    setIsLoading(false)
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    await new Promise(resolve => setTimeout(resolve, 1000))

    const code = verificationCode.join("")
    if (code.length === 6) {
      setScreen("new-password")
    } else {
      setError("CÓDIGO INVÁLIDO")
    }

    setIsLoading(false)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    await new Promise(resolve => setTimeout(resolve, 1000))

    if (newPassword.length < 6) {
      setError("SENHA DEVE TER NO MÍNIMO 6 CARACTERES")
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmNewPassword) {
      setError("AS SENHAS NÃO COINCIDEM")
      setIsLoading(false)
      return
    }

    setScreen("success")
    setIsLoading(false)
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0]
    }
    
    const newCode = [...verificationCode]
    newCode[index] = value.toUpperCase()
    setVerificationCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      prevInput?.focus()
    }
  }

  const resetFlow = () => {
    setScreen("login")
    setRecoveryEmail("")
    setVerificationCode(["", "", "", "", "", ""])
    setNewPassword("")
    setConfirmNewPassword("")
    setError("")
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 50px,
            #F4511E 50px,
            #F4511E 51px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 50px,
            #F4511E 50px,
            #F4511E 51px
          )`
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Login Card */}
        <div className="border border-border bg-card">
          {/* Header */}
          <div className="border-b border-border p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
                <Image
                  src="/logo.png"
                  alt="Combat Tático Academy"
                  fill
                  sizes="48px"
                  className="object-contain p-1"
                  priority
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-wide">
                  COMBAT TÁTICO ACADEMY
                </h1>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-widest">
                  Sistema de Treinamento
                </p>
              </div>
            </div>
          </div>

          {/* Login Screen */}
          {screen === "login" && (
            <form onSubmit={handleLogin} className="p-4 sm:p-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-3 w-3 text-[#6b7a5f]" />
                  <label className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Autenticação Requerida
                  </label>
                </div>
              </div>

              {error && (
                <div className="mb-4 border border-red-500/50 bg-red-500/10 p-3 text-center">
                  <span className="text-xs text-red-500 uppercase tracking-wider">
                    {error}
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Identificação
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7a5f]" />
                    <Input
                      type="email"
                      placeholder="operador@combat.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 border-border bg-secondary pl-10 text-foreground placeholder:text-muted-foreground rounded-none focus:border-[#F4511E] focus:ring-[#F4511E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Código de Acesso
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7a5f]" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 border-border bg-secondary pl-10 pr-10 text-foreground placeholder:text-muted-foreground rounded-none focus:border-[#F4511E] focus:ring-[#F4511E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a5f] hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-[#F4511E] text-white font-bold uppercase tracking-wider hover:bg-[#F4511E]/90 rounded-none"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      AUTENTICANDO...
                    </span>
                  ) : (
                    "ACESSAR SISTEMA"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setError("")
                    setScreen("forgot-password")
                  }}
                  className="w-full text-center text-xs text-[#6b7a5f] hover:text-[#F4511E] uppercase tracking-wider transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-center text-xs text-[#6b7a5f]">
                  Acesso não autorizado será reportado e rastreado
                </p>
              </div>
            </form>
          )}

          {/* Forgot Password Screen */}
          {screen === "forgot-password" && (
            <form onSubmit={handleSendCode} className="p-4 sm:p-6">
              <button
                type="button"
                onClick={resetFlow}
                className="flex items-center gap-2 text-xs text-[#6b7a5f] hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                <span className="uppercase tracking-wider">Voltar ao Login</span>
              </button>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-3 w-3 text-[#F4511E]" />
                  <label className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Recuperar Acesso
                  </label>
                </div>
                <p className="text-sm text-foreground">
                  Informe seu email cadastrado para receber o código de verificação.
                </p>
              </div>

              {error && (
                <div className="mb-4 border border-red-500/50 bg-red-500/10 p-3 text-center">
                  <span className="text-xs text-red-500 uppercase tracking-wider">
                    {error}
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Email Cadastrado
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7a5f]" />
                    <Input
                      type="email"
                      placeholder="seu-email@exemplo.com"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="h-11 border-border bg-secondary pl-10 text-foreground placeholder:text-muted-foreground rounded-none focus:border-[#F4511E] focus:ring-[#F4511E]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !recoveryEmail}
                  className="w-full h-11 bg-[#F4511E] text-white font-bold uppercase tracking-wider hover:bg-[#F4511E]/90 rounded-none disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      ENVIANDO...
                    </span>
                  ) : (
                    "ENVIAR CÓDIGO"
                  )}
                </Button>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-center text-xs text-[#6b7a5f]">
                  O código será enviado para o email informado
                </p>
              </div>
            </form>
          )}

          {/* Verify Code Screen */}
          {screen === "verify-code" && (
            <form onSubmit={handleVerifyCode} className="p-4 sm:p-6">
              <button
                type="button"
                onClick={() => {
                  setError("")
                  setScreen("forgot-password")
                }}
                className="flex items-center gap-2 text-xs text-[#6b7a5f] hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                <span className="uppercase tracking-wider">Voltar</span>
              </button>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound className="h-3 w-3 text-[#F4511E]" />
                  <label className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Verificar Código
                  </label>
                </div>
                <p className="text-sm text-foreground">
                  Digite o código de 6 dígitos enviado para:
                </p>
                <p className="text-sm text-[#F4511E] font-bold mt-1">
                  {recoveryEmail}
                </p>
              </div>

              {error && (
                <div className="mb-4 border border-red-500/50 bg-red-500/10 p-3 text-center">
                  <span className="text-xs text-red-500 uppercase tracking-wider">
                    {error}
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-3 block text-xs text-[#6b7a5f] uppercase tracking-wider text-center">
                    Código de Verificação
                  </label>
                  <div className="flex flex-wrap justify-center gap-2 sm:flex-nowrap">
                    {verificationCode.map((digit, index) => (
                      <Input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(index, e)}
                        className="h-10 w-10 border-border bg-secondary text-foreground text-center text-base font-bold rounded-none focus:border-[#F4511E] focus:ring-[#F4511E] sm:h-12 sm:w-12 sm:text-lg"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || verificationCode.join("").length < 6}
                  className="w-full h-11 bg-[#F4511E] text-white font-bold uppercase tracking-wider hover:bg-[#F4511E]/90 rounded-none disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      VERIFICANDO...
                    </span>
                  ) : (
                    "VERIFICAR CÓDIGO"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setVerificationCode(["", "", "", "", "", ""])
                  }}
                  className="w-full text-center text-xs text-[#6b7a5f] hover:text-[#F4511E] uppercase tracking-wider transition-colors"
                >
                  Reenviar código
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-center text-xs text-[#6b7a5f]">
                  O código expira em 10 minutos
                </p>
              </div>
            </form>
          )}

          {/* New Password Screen */}
          {screen === "new-password" && (
            <form onSubmit={handleResetPassword} className="p-4 sm:p-6">
              <button
                type="button"
                onClick={() => {
                  setError("")
                  setScreen("verify-code")
                }}
                className="flex items-center gap-2 text-xs text-[#6b7a5f] hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                <span className="uppercase tracking-wider">Voltar</span>
              </button>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-3 w-3 text-[#F4511E]" />
                  <label className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Nova Senha
                  </label>
                </div>
                <p className="text-sm text-foreground">
                  Defina sua nova senha de acesso ao sistema.
                </p>
              </div>

              {error && (
                <div className="mb-4 border border-red-500/50 bg-red-500/10 p-3 text-center">
                  <span className="text-xs text-red-500 uppercase tracking-wider">
                    {error}
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7a5f]" />
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-11 border-border bg-secondary pl-10 pr-10 text-foreground placeholder:text-muted-foreground rounded-none focus:border-[#F4511E] focus:ring-[#F4511E]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a5f] hover:text-foreground"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 6 && (
                    <p className="text-xs text-red-500 mt-1">Mínimo 6 caracteres</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7a5f]" />
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Repita a nova senha"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="h-11 border-border bg-secondary pl-10 text-foreground placeholder:text-muted-foreground rounded-none focus:border-[#F4511E] focus:ring-[#F4511E]"
                    />
                  </div>
                  {confirmNewPassword && newPassword !== confirmNewPassword && (
                    <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || newPassword.length < 6 || newPassword !== confirmNewPassword}
                  className="w-full h-11 bg-[#F4511E] text-white font-bold uppercase tracking-wider hover:bg-[#F4511E]/90 rounded-none disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      SALVANDO...
                    </span>
                  ) : (
                    "REDEFINIR SENHA"
                  )}
                </Button>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-center text-xs text-[#6b7a5f]">
                  Use uma senha forte e única
                </p>
              </div>
            </form>
          )}

          {/* Success Screen */}
          {screen === "success" && (
            <div className="p-4 sm:p-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center border-2 border-green-500 bg-green-500/10">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                
                <h2 className="text-lg font-bold text-foreground mb-2 uppercase tracking-wider">
                  Senha Redefinida
                </h2>
                <p className="text-sm text-[#6b7a5f] mb-6">
                  Sua senha foi alterada com sucesso. Agora você pode acessar o sistema com sua nova senha.
                </p>

                <Button
                  onClick={resetFlow}
                  className="w-full h-11 bg-[#F4511E] text-white font-bold uppercase tracking-wider hover:bg-[#F4511E]/90 rounded-none"
                >
                  FAZER LOGIN
                </Button>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-center text-xs text-[#6b7a5f]">
                  Mantenha sua senha em segurança
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-border bg-secondary/50 px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#6b7a5f] sm:text-xs">
              <span>v2.4.1</span>
              <span className="uppercase tracking-wider">Sistema Seguro</span>
              <span>TLS 1.3</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
