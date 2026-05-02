"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  BookOpen, 
  Search,
  ChevronRight,
  Plus,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  Clock,
  Users,
  Layers
} from "lucide-react"
import { Header } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/admin/rich-text-editor"

interface Course {
  id: number
  code: string
  name: string
  description: string
  thumbnail: string
  totalHours: string
  modulesCount: number
  studentsCount: number
  completionRate: number
  averageScore: number
  status: "ativo" | "rascunho"
}

const initialCourses: Course[] = [
  {
    id: 1,
    code: "CQC-001",
    name: "Táticas de Combate Próximo",
    description: "Treinamento avançado em técnicas de combate corpo a corpo e defesa pessoal tática.",
    thumbnail: "",
    totalHours: "40h",
    modulesCount: 8,
    studentsCount: 4,
    completionRate: 82,
    averageScore: 88,
    status: "ativo"
  },
  {
    id: 2,
    code: "SSP-002",
    name: "Supervisor em Segurança Privada",
    description: "Formação completa para supervisores de equipes de segurança patrimonial e pessoal.",
    thumbnail: "",
    totalHours: "60h",
    modulesCount: 12,
    studentsCount: 2,
    completionRate: 74,
    averageScore: 90,
    status: "ativo"
  },
  {
    id: 3,
    code: "ARM-003",
    name: "Instrução de Armeiro",
    description: "Curso técnico de manutenção, reparo e customização de armamentos.",
    thumbnail: "",
    totalHours: "24h",
    modulesCount: 10,
    studentsCount: 1,
    completionRate: 45,
    averageScore: 76,
    status: "rascunho"
  }
]

const stripHtml = (value: string) => {
  return value.replace(/<[^>]*>/g, "").trim()
}

export default function AdminCoursesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCourse, setNewCourse] = useState({
    name: "",
    code: "",
    description: "",
    thumbnail: "",
    totalHours: ""
  })

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddCourse = () => {
    if (newCourse.name && newCourse.code) {
      const newId = Math.max(...courses.map(c => c.id)) + 1
      setCourses([
        ...courses,
        {
          id: newId,
          code: newCourse.code.toUpperCase(),
          name: newCourse.name,
          description: newCourse.description,
          thumbnail: newCourse.thumbnail,
          totalHours: newCourse.totalHours || "0h",
          modulesCount: 0,
          studentsCount: 0,
          completionRate: 0,
          averageScore: 0,
          status: "rascunho"
        }
      ])
      setNewCourse({
        name: "",
        code: "",
        description: "",
        thumbnail: "",
        totalHours: ""
      })
      setShowAddModal(false)
    }
  }

  const isFormValid = newCourse.name && newCourse.code

  return (
    <div className="min-h-screen bg-background">
      <Header userName="Comandante Admin" isAdmin />

      <main className="p-4 md:p-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Cursos</h1>
            <p className="text-sm text-[#6b7a5f]">Adicione e gerencie cursos, módulos e aulas</p>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Curso
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a5f]" />
          <Input
            placeholder="Buscar por nome ou código do curso..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-border bg-secondary rounded-none w-full sm:max-w-md"
          />
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div 
              key={course.id} 
              onClick={() => router.push(`/admin/cursos/${course.id}`)}
              className="border border-border bg-card hover:border-[#F4511E]/50 transition-colors cursor-pointer group"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-secondary border-b border-border flex items-center justify-center">
                {course.thumbnail ? (
                  <img 
                    src={course.thumbnail} 
                    alt={course.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <BookOpen className="h-12 w-12 text-[#6b7a5f] mx-auto mb-2" />
                    <span className="text-xs text-[#6b7a5f]">Sem thumbnail</span>
                  </div>
                )}
              </div>

              {/* Course Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                      {course.code}
                    </span>
                    <h3 className="font-bold text-foreground group-hover:text-[#F4511E] transition-colors">
                      {course.name}
                    </h3>
                  </div>
                  <span className={`text-xs px-2 py-1 uppercase tracking-wider ${
                    course.status === "ativo" 
                      ? "text-green-500 bg-green-500/10" 
                      : "text-yellow-500 bg-yellow-500/10"
                  }`}>
                    {course.status}
                  </span>
                </div>

                <p className="text-sm text-[#6b7a5f] mb-4 line-clamp-2">
                  {stripHtml(course.description)}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-[#6b7a5f]">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{course.totalHours}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-[#6b7a5f]">
                      <Layers className="h-3 w-3" />
                      <span className="text-xs">{course.modulesCount} módulos</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-[#6b7a5f]">
                      <Users className="h-3 w-3" />
                      <span className="text-xs">{course.studentsCount} alunos</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-border">
                  <div className="text-center">
                    <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Conclusao</p>
                    <p className="text-sm text-foreground font-bold">{course.completionRate}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Nota media</p>
                    <p className="text-sm text-foreground font-bold">{course.averageScore}%</p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="px-4 pb-4">
                <div className="flex items-center justify-end gap-2 text-[#6b7a5f] group-hover:text-[#F4511E] transition-colors">
                  <span className="text-xs uppercase tracking-wider">
                    Gerenciar
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="border border-border bg-card p-8 text-center">
            <BookOpen className="h-12 w-12 text-[#6b7a5f] mx-auto mb-3" />
            <p className="text-[#6b7a5f]">Nenhum curso encontrado.</p>
          </div>
        )}
      </main>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-xl my-8 max-h-[calc(100vh-2rem)] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
                  <BookOpen className="h-5 w-5 text-[#F4511E]" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Novo Curso</h2>
                  <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Criar novo curso na plataforma
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[#6b7a5f] hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 min-h-0 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    Nome do Curso *
                  </label>
                  <Input
                    placeholder="Ex: Táticas de Combate Avançado"
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                    className="border-border bg-secondary rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    Código *
                  </label>
                  <Input
                    placeholder="Ex: TCA-001"
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                    className="border-border bg-secondary rounded-none uppercase"
                  />
                </div>
              </div>

              <RichTextEditor
                label="Manual tatico"
                value={newCourse.description}
                onChange={(value) => setNewCourse({ ...newCourse, description: value })}
                placeholder="Descreva o conteudo e objetivos do curso..."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    <ImageIcon className="h-3 w-3 inline mr-1" />
                    URL da Thumbnail
                  </label>
                  <Input
                    placeholder="https://..."
                    value={newCourse.thumbnail}
                    onChange={(e) => setNewCourse({ ...newCourse, thumbnail: e.target.value })}
                    className="border-border bg-secondary rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Carga Horária
                  </label>
                  <Input
                    placeholder="Ex: 40h"
                    value={newCourse.totalHours}
                    onChange={(e) => setNewCourse({ ...newCourse, totalHours: e.target.value })}
                    className="border-border bg-secondary rounded-none"
                  />
                </div>
              </div>

              <p className="text-xs text-[#6b7a5f]">
                Após criar o curso, você poderá adicionar módulos e aulas na página de gerenciamento.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse gap-3 p-4 border-t border-border sm:flex-row">
              <Button 
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1 border-border rounded-none"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddCourse}
                disabled={!isFormValid}
                className="flex-1 bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none disabled:opacity-50"
              >
                Criar Curso
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
