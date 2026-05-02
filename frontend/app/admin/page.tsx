"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Users, 
  BookOpen, 
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Mail,
  Calendar,
  Shield,
  TrendingUp,
  Clock,
  UserPlus,
  X,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  CreditCard,
  Lock,
  ClipboardCheck,
  Megaphone,
  FolderOpen
} from "lucide-react"
import { Header } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const initialStudents = [
  {
    id: 1,
    name: "João Silva",
    email: "joao.silva@email.com",
    enrolled: "15/01/2024",
    status: "ativo",
    coursesCount: 2
  },
  {
    id: 2,
    name: "Maria Santos",
    email: "maria.santos@email.com",
    enrolled: "22/02/2024",
    status: "ativo",
    coursesCount: 1
  },
  {
    id: 3,
    name: "Carlos Oliveira",
    email: "carlos.oliveira@email.com",
    enrolled: "08/03/2024",
    status: "pendente",
    coursesCount: 0
  },
  {
    id: 4,
    name: "Ana Costa",
    email: "ana.costa@email.com",
    enrolled: "10/01/2024",
    status: "ativo",
    coursesCount: 3
  },
  {
    id: 5,
    name: "Pedro Ferreira",
    email: "pedro.ferreira@email.com",
    enrolled: "28/02/2024",
    status: "inativo",
    coursesCount: 1
  }
]

const coursesList = [
  { code: "CQC-001", name: "Táticas de Combate Próximo" },
  { code: "SSP-002", name: "Supervisor em Segurança Privada" },
  { code: "ARM-003", name: "Instrução de Armeiro" }
]

const stats = [
  { label: "Total de Alunos", value: "156", change: "+12%", icon: Users },
  { label: "Cursos Ativos", value: "3", change: "", icon: BookOpen },
  { label: "Taxa de Conclusao", value: "78%", change: "+5%", icon: TrendingUp },
  { label: "Nota Media", value: "84%", change: "+2%", icon: Clock }
]

export default function AdminPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [students, setStudents] = useState(initialStudents)
  const [activeTab, setActiveTab] = useState("alunos")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newStudent, setNewStudent] = useState({ 
    name: "", 
    email: "", 
    cpf: "",
    phone: "",
    birthDate: "",
    address: "",
    city: "",
    state: "",
    password: "",
    confirmPassword: ""
  })

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ativo":
        return { label: "Ativo", color: "text-green-500", bg: "bg-green-500/10" }
      case "pendente":
        return { label: "Pendente", color: "text-yellow-500", bg: "bg-yellow-500/10" }
      case "inativo":
        return { label: "Inativo", color: "text-red-500", bg: "bg-red-500/10" }
      default:
        return { label: status, color: "text-[#6b7a5f]", bg: "bg-[#6b7a5f]/10" }
    }
  }

  const handleAddStudent = () => {
    if (newStudent.name && newStudent.email && newStudent.cpf && newStudent.password && newStudent.password === newStudent.confirmPassword) {
      const today = new Date()
      const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
      
      const newId = Math.max(...students.map(s => s.id)) + 1
      setStudents([
        ...students,
        {
          id: newId,
          name: newStudent.name,
          email: newStudent.email,
          enrolled: formattedDate,
          status: "pendente",
          coursesCount: 0
        }
      ])
      setNewStudent({ 
        name: "", 
        email: "", 
        cpf: "",
        phone: "",
        birthDate: "",
        address: "",
        city: "",
        state: "",
        password: "",
        confirmPassword: ""
      })
      setShowPassword(false)
      setShowAddModal(false)
    }
  }

  const isFormValid = newStudent.name && 
    newStudent.email && 
    newStudent.cpf && 
    newStudent.password && 
    newStudent.password === newStudent.confirmPassword &&
    newStudent.password.length >= 6

  const handleStudentClick = (studentId: number) => {
    router.push(`/admin/aluno/${studentId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userName="Comandante Admin" isAdmin />

      <main className="p-4 md:p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="border border-border bg-card p-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 12px, #F4511E 12px, #F4511E 13px)"
              }} />
              <div className="flex items-start justify-between relative">
                <div>
                  <p className="text-xs text-[#6b7a5f] uppercase tracking-wider mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  {stat.change && (
                    <p className="text-xs text-green-500 mt-1">{stat.change} este mês</p>
                  )}
                </div>
                <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
                  <stat.icon className="h-5 w-5 text-[#F4511E]" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Command Center */}
        <div className="border border-border bg-card p-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Central Operacional
              </h2>
              <p className="text-xs text-[#6b7a5f]">Acesso rapido as ferramentas do AVA</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => router.push("/admin/revisao")}
              className="flex items-center justify-between border border-border bg-secondary/30 p-4 hover:border-[#F4511E] transition-colors"
            >
              <div>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Correcao</p>
                <p className="text-sm text-foreground">Revisao de Atividades</p>
              </div>
              <ClipboardCheck className="h-5 w-5 text-[#F4511E]" />
            </button>
            <button
              onClick={() => router.push("/admin/biblioteca")}
              className="flex items-center justify-between border border-border bg-secondary/30 p-4 hover:border-[#F4511E] transition-colors"
            >
              <div>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Repositorio</p>
                <p className="text-sm text-foreground">Biblioteca Global</p>
              </div>
              <FolderOpen className="h-5 w-5 text-[#F4511E]" />
            </button>
            <button
              onClick={() => router.push("/admin/broadcast")}
              className="flex items-center justify-between border border-border bg-secondary/30 p-4 hover:border-[#F4511E] transition-colors"
            >
              <div>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Comunicacao</p>
                <p className="text-sm text-foreground">Broadcast Operacional</p>
              </div>
              <Megaphone className="h-5 w-5 text-[#F4511E]" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-border sm:gap-4">
          <button
            onClick={() => setActiveTab("alunos")}
            className={`pb-3 text-xs uppercase tracking-wider transition-colors sm:text-sm ${
              activeTab === "alunos"
                ? "text-[#F4511E] border-b-2 border-[#F4511E]"
                : "text-[#6b7a5f] hover:text-foreground"
            }`}
          >
            Gerenciar Alunos
          </button>
          <button
            onClick={() => setActiveTab("cursos")}
            className={`pb-3 text-xs uppercase tracking-wider transition-colors sm:text-sm ${
              activeTab === "cursos"
                ? "text-[#F4511E] border-b-2 border-[#F4511E]"
                : "text-[#6b7a5f] hover:text-foreground"
            }`}
          >
            Cursos
          </button>
        </div>

        {activeTab === "alunos" && (
          <>
            {/* Search, Filter and Add Button */}
            <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a5f]" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-border bg-secondary rounded-none"
                />
              </div>
              <Button variant="outline" className="border-border rounded-none w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none w-full sm:w-auto"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Aluno
              </Button>
            </div>

            {/* Students List */}
            <div className="border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-border bg-secondary/70">
                      <th className="text-left p-4 text-xs text-[#6b7a5f] uppercase tracking-wider font-medium">
                        Aluno
                      </th>
                      <th className="text-left p-4 text-xs text-[#6b7a5f] uppercase tracking-wider font-medium hidden md:table-cell">
                        Matrícula
                      </th>
                      <th className="text-left p-4 text-xs text-[#6b7a5f] uppercase tracking-wider font-medium">
                        Status
                      </th>
                      <th className="text-center p-4 text-xs text-[#6b7a5f] uppercase tracking-wider font-medium hidden sm:table-cell">
                        Cursos Liberados
                      </th>
                      <th className="text-right p-4 text-xs text-[#6b7a5f] uppercase tracking-wider font-medium">
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStudents.map((student) => {
                      const status = getStatusConfig(student.status)
                      return (
                        <tr 
                          key={student.id} 
                          onClick={() => handleStudentClick(student.id)}
                          className="hover:bg-secondary/30 transition-colors cursor-pointer group"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-10 w-10 items-center justify-center bg-[#6b7a5f]/20 border border-[#6b7a5f]">
                                <span className="text-sm font-bold text-[#6b7a5f]">
                                  {student.name.split(" ").map(n => n[0]).join("")}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground text-sm group-hover:text-[#F4511E] transition-colors truncate">
                                  {student.name}
                                </p>
                                <p className="text-xs text-[#6b7a5f] flex items-center gap-1 break-all">
                                  <Mail className="h-3 w-3" />
                                  {student.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            <div className="flex items-center gap-1 text-xs text-[#6b7a5f]">
                              <Calendar className="h-3 w-3" />
                              {student.enrolled}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`text-xs px-2 py-1 uppercase tracking-wider ${status.color} ${status.bg}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="p-4 text-center hidden sm:table-cell">
                            <span className="text-sm font-bold text-foreground">
                              {student.coursesCount}
                            </span>
                            <span className="text-xs text-[#6b7a5f]"> / 3</span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2 text-[#6b7a5f] group-hover:text-[#F4511E] transition-colors">
                              <span className="text-xs uppercase tracking-wider hidden sm:inline">
                                Gerenciar
                              </span>
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {filteredStudents.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-[#6b7a5f]">Nenhum aluno encontrado.</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "cursos" && (
          <div className="border border-border bg-card p-8 text-center">
            <BookOpen className="h-16 w-16 text-[#6b7a5f] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Gestão de Cursos</h3>
            <p className="text-[#6b7a5f] mb-6">
              Acesse a área completa para adicionar cursos, módulos e aulas.
            </p>
            <Button 
              onClick={() => router.push("/admin/cursos")}
              className="bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Acessar Gestão de Cursos
            </Button>
          </div>
        )}
      </main>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-2xl my-8 max-h-[calc(100vh-2rem)] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
                  <UserPlus className="h-5 w-5 text-[#F4511E]" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Cadastro de Novo Aluno</h2>
                  <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Preencha todos os dados do operador
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAddModal(false)
                  setShowPassword(false)
                }}
                className="text-[#6b7a5f] hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-6 min-h-0 overflow-y-auto">
              {/* Dados Pessoais */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#F4511E]" />
                  Dados Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      Nome Completo *
                    </label>
                    <Input
                      placeholder="Digite o nome completo"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      className="border-border bg-secondary rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      <CreditCard className="h-3 w-3 inline mr-1" />
                      CPF *
                    </label>
                    <Input
                      placeholder="000.000.000-00"
                      value={newStudent.cpf}
                      onChange={(e) => setNewStudent({ ...newStudent, cpf: e.target.value })}
                      className="border-border bg-secondary rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Data de Nascimento
                    </label>
                    <Input
                      type="date"
                      value={newStudent.birthDate}
                      onChange={(e) => setNewStudent({ ...newStudent, birthDate: e.target.value })}
                      className="border-border bg-secondary rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#F4511E]" />
                  Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      <Mail className="h-3 w-3 inline mr-1" />
                      Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                      className="border-border bg-secondary rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      <Phone className="h-3 w-3 inline mr-1" />
                      Telefone / WhatsApp
                    </label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={newStudent.phone}
                      onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                      className="border-border bg-secondary rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Endereco */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#F4511E]" />
                  Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      Endereço Completo
                    </label>
                    <Input
                      placeholder="Rua, número, bairro"
                      value={newStudent.address}
                      onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                      className="border-border bg-secondary rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      Cidade
                    </label>
                    <Input
                      placeholder="Sua cidade"
                      value={newStudent.city}
                      onChange={(e) => setNewStudent({ ...newStudent, city: e.target.value })}
                      className="border-border bg-secondary rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      Estado
                    </label>
                    <Input
                      placeholder="UF"
                      value={newStudent.state}
                      onChange={(e) => setNewStudent({ ...newStudent, state: e.target.value })}
                      className="border-border bg-secondary rounded-none"
                    />
                  </div>
                </div>
              </div>

              {/* Credenciais de Acesso */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#F4511E]" />
                  Credenciais de Acesso
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      Senha *
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={newStudent.password}
                        onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                        className="border-border bg-secondary rounded-none pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a5f] hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {newStudent.password && newStudent.password.length < 6 && (
                      <p className="text-xs text-red-500 mt-1">A senha deve ter no mínimo 6 caracteres</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      Confirmar Senha *
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Repita a senha"
                        value={newStudent.confirmPassword}
                        onChange={(e) => setNewStudent({ ...newStudent, confirmPassword: e.target.value })}
                        className="border-border bg-secondary rounded-none pr-10"
                      />
                    </div>
                    {newStudent.confirmPassword && newStudent.password !== newStudent.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#6b7a5f] mt-3">
                  O aluno usará o <span className="text-[#F4511E]">email</span> e esta <span className="text-[#F4511E]">senha</span> para acessar a plataforma.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse gap-3 p-4 border-t border-border sm:flex-row">
              <Button 
                variant="outline"
                onClick={() => {
                  setShowAddModal(false)
                  setShowPassword(false)
                }}
                className="flex-1 border-border rounded-none"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddStudent}
                disabled={!isFormValid}
                className="flex-1 bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none disabled:opacity-50"
              >
                Cadastrar Aluno
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
