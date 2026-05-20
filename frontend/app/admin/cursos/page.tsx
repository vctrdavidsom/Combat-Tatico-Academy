"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Search,
  ChevronRight,
  Plus,
  X,
  Image as ImageIcon,
  Clock,
  Users,
  Layers
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/admin/rich-text-editor"

type AdminCourse = {
  id: number
  code: string
  name: string
  description: string
  duration: string
  thumbnail_url?: string | null
  is_active: boolean
}

const API_BASE_URL = "/api"
const ACCESS_TOKEN_KEY = "cta_access_token"

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "").trim()

const readJsonResponse = async <T,>(response: Response) => {
  const raw = await response.text()
  if (!raw) {
    return { data: null as T | null, raw: "" }
  }
  try {
    return { data: JSON.parse(raw) as T, raw }
  } catch {
    return { data: null as T | null, raw }
  }
}

const resolveApiError = (raw: string, data: unknown, fallback: string) => {
  const detail = (data as { detail?: unknown } | null)?.detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (item as { msg?: string })?.msg || JSON.stringify(item))
      .join(" | ")
  }
  if (typeof detail === "string") {
    return detail
  }
  if (detail) {
    return JSON.stringify(detail)
  }
  return raw || fallback
}

export default function AdminCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [coursesError, setCoursesError] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [newCourse, setNewCourse] = useState({
    name: "",
    code: "",
    description: "",
    thumbnailUrl: "",
    duration: ""
  })

  const loadCourses = useCallback(async () => {
    setCoursesError("")
    setIsLoadingCourses(true)
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setCourses([])
        setCoursesError("Token nao encontrado. Faca login novamente.")
        return
      }

      const response = await fetch(`${API_BASE_URL}/courses/admin/courses`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const { data, raw } = await readJsonResponse<AdminCourse[] | { detail?: unknown }>(response)
      if (!response.ok) {
        setCoursesError(resolveApiError(raw, data, "Erro ao carregar cursos."))
        setCourses([])
        return
      }

      setCourses(Array.isArray(data) ? data : [])
    } catch {
      setCoursesError("Falha ao conectar com o servidor.")
      setCourses([])
    } finally {
      setIsLoadingCourses(false)
    }
  }, [])

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  const filteredCourses = useMemo(() => {
    const term = searchQuery.toLowerCase()
    return courses.filter(
      (course) =>
        course.name.toLowerCase().includes(term) ||
        course.code.toLowerCase().includes(term)
    )
  }, [courses, searchQuery])

  const handleAddCourse = async () => {
    if (!newCourse.name || !newCourse.code || isCreating) return
    setCreateError("")
    setIsCreating(true)

    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/courses/admin/courses`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: newCourse.code.toUpperCase(),
          name: newCourse.name,
          description: newCourse.description || "",
          duration: newCourse.duration || "0h",
          thumbnail_url: newCourse.thumbnailUrl || null
        })
      })

      const { data, raw } = await readJsonResponse<{ detail?: unknown }>(response)
      if (!response.ok) {
        setCreateError(resolveApiError(raw, data, "Erro ao criar curso."))
        return
      }

      await loadCourses()
      setNewCourse({
        name: "",
        code: "",
        description: "",
        thumbnailUrl: "",
        duration: ""
      })
      setShowAddModal(false)
    } catch {
      setCreateError("Falha ao conectar com o servidor.")
    } finally {
      setIsCreating(false)
    }
  }

  const isFormValid = newCourse.name && newCourse.code

  return (
    <div>
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

        {coursesError && (
          <div className="border border-border bg-card p-4 text-sm text-red-500 mb-6">
            {coursesError}
          </div>
        )}

        {isLoadingCourses && (
          <div className="border border-border bg-card p-8 text-center">
            <BookOpen className="h-12 w-12 text-[#6b7a5f] mx-auto mb-3" />
            <p className="text-[#6b7a5f]">Carregando cursos...</p>
          </div>
        )}

        {!isLoadingCourses && (
          <>
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
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
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
                      <span
                        className={`text-xs px-2 py-1 uppercase tracking-wider ${
                          course.is_active
                            ? "text-green-500 bg-green-500/10"
                            : "text-yellow-500 bg-yellow-500/10"
                        }`}
                      >
                        {course.is_active ? "ativo" : "inativo"}
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
                          <span className="text-xs">{course.duration}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-[#6b7a5f]">
                          <Layers className="h-3 w-3" />
                          <span className="text-xs">-- modulos</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-[#6b7a5f]">
                          <Users className="h-3 w-3" />
                          <span className="text-xs">-- alunos</span>
                        </div>
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
          </>
        )}
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
                    value={newCourse.thumbnailUrl}
                    onChange={(e) => setNewCourse({ ...newCourse, thumbnailUrl: e.target.value })}
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
                    value={newCourse.duration}
                    onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                    className="border-border bg-secondary rounded-none"
                  />
                </div>
              </div>

              {createError && (
                <p className="text-xs text-red-500">{createError}</p>
              )}

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
                disabled={!isFormValid || isCreating}
                className="flex-1 bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none disabled:opacity-50"
              >
                {isCreating ? "Criando..." : "Criar Curso"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
