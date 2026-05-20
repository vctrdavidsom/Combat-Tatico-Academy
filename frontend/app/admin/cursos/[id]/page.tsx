"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  Plus,
  X,
  Image as ImageIcon,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  GripVertical,
  Save
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/admin/rich-text-editor"

type ApiModule = {
  id: number
  title: string
  description?: string | null
  order: number
  course_id: number
}

type ApiCourse = {
  id: number
  code: string
  name: string
  description: string
  duration: string
  thumbnail_url?: string | null
  is_active: boolean
}

type ApiCourseDetail = ApiCourse & {
  modules: ApiModule[]
}

type CourseDraft = {
  code: string
  name: string
  description: string
  duration: string
  thumbnail_url: string
}

const API_BASE_URL = "/api"
const ACCESS_TOKEN_KEY = "cta_access_token"

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

const toDraft = (course: ApiCourse): CourseDraft => ({
  code: course.code,
  name: course.name,
  description: course.description,
  duration: course.duration,
  thumbnail_url: course.thumbnail_url ?? ""
})

export default function AdminCourseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = Number(params.id)
  const [course, setCourse] = useState<ApiCourseDetail | null>(null)
  const [draft, setDraft] = useState<CourseDraft>({
    code: "",
    name: "",
    description: "",
    duration: "",
    thumbnail_url: ""
  })
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({})
  const [showAddModuleModal, setShowAddModuleModal] = useState(false)
  const [newModule, setNewModule] = useState({ title: "", description: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [isCreatingModule, setIsCreatingModule] = useState(false)
  const [moduleError, setModuleError] = useState("")
  const [isDeletingCourse, setIsDeletingCourse] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const modules = useMemo(() => {
    const list = course?.modules ?? []
    return [...list].sort((a, b) => a.order - b.order)
  }, [course])

  const loadCourse = useCallback(async () => {
    setLoadError("")
    setIsLoading(true)
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setCourse(null)
        setLoadError("Token nao encontrado. Faca login novamente.")
        return
      }

      const response = await fetch(`${API_BASE_URL}/courses/admin/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const { data, raw } = await readJsonResponse<ApiCourseDetail | { detail?: unknown }>(response)
      if (!response.ok) {
        setCourse(null)
        setLoadError(resolveApiError(raw, data, "Erro ao carregar curso."))
        return
      }

      if (data && typeof data === "object" && !Array.isArray(data)) {
        const resolved = data as ApiCourseDetail
        setCourse(resolved)
        setDraft(toDraft(resolved))
        setExpandedModules((prev) => {
          if (Object.keys(prev).length || !resolved.modules.length) {
            return prev
          }
          return { [resolved.modules[0].id]: true }
        })
      } else {
        setCourse(null)
        setLoadError("Curso nao encontrado.")
      }
    } catch {
      setCourse(null)
      setLoadError("Falha ao conectar com o servidor.")
    } finally {
      setIsLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    if (!Number.isFinite(courseId)) {
      setLoadError("Curso invalido.")
      return
    }
    loadCourse()
  }, [courseId, loadCourse])

  const handleToggleActive = async (checked: boolean) => {
    if (!course || isSaving) return
    setSaveError("")
    setIsSaving(true)

    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setSaveError("Token nao encontrado. Faca login novamente.")
        return
      }

      const response = await fetch(`${API_BASE_URL}/courses/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: checked })
      })

      const { data, raw } = await readJsonResponse<ApiCourse | { detail?: unknown }>(response)
      if (!response.ok) {
        setSaveError(resolveApiError(raw, data, "Erro ao atualizar status."))
        return
      }

      const updated = data && typeof data === "object" ? (data as ApiCourse) : null
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              is_active: updated?.is_active ?? checked
            }
          : prev
      )
    } catch {
      setSaveError("Falha ao conectar com o servidor.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCourse = async () => {
    if (!course || isSaving) return
    if (!draft.name || !draft.code) {
      setSaveError("Nome e codigo sao obrigatorios.")
      return
    }

    setSaveError("")
    setIsSaving(true)

    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setSaveError("Token nao encontrado. Faca login novamente.")
        return
      }

      const payload = {
        code: draft.code,
        name: draft.name,
        description: draft.description,
        duration: draft.duration,
        thumbnail_url: draft.thumbnail_url || null
      }

      const response = await fetch(`${API_BASE_URL}/courses/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const { data, raw } = await readJsonResponse<ApiCourse | { detail?: unknown }>(response)
      if (!response.ok) {
        setSaveError(resolveApiError(raw, data, "Erro ao salvar curso."))
        return
      }

      const updated = data && typeof data === "object" ? (data as ApiCourse) : null
      const nextCourse = updated
        ? { ...course, ...updated }
        : {
            ...course,
            code: payload.code,
            name: payload.name,
            description: payload.description,
            duration: payload.duration,
            thumbnail_url: payload.thumbnail_url
          }

      setCourse({ ...nextCourse, modules: course.modules })
      setDraft(toDraft(nextCourse))
    } catch {
      setSaveError("Falha ao conectar com o servidor.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddModule = async () => {
    if (!course || !newModule.title || isCreatingModule) return
    setModuleError("")
    setIsCreatingModule(true)

    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setModuleError("Token nao encontrado. Faca login novamente.")
        return
      }

      const nextOrder = modules.length
        ? Math.max(...modules.map((module) => module.order)) + 1
        : 1

      const response = await fetch(`${API_BASE_URL}/courses/admin/courses/${course.id}/modules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newModule.title,
          description: newModule.description || null,
          order: nextOrder
        })
      })

      const { data, raw } = await readJsonResponse<ApiModule | { detail?: unknown }>(response)
      if (!response.ok) {
        setModuleError(resolveApiError(raw, data, "Erro ao criar modulo."))
        return
      }

      if (!data || typeof data !== "object") {
        setModuleError("Resposta invalida ao criar modulo.")
        return
      }

      const created = data as ApiModule
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              modules: [...prev.modules, created]
            }
          : prev
      )
      setExpandedModules((prev) => ({ ...prev, [created.id]: true }))
      setNewModule({ title: "", description: "" })
      setShowAddModuleModal(false)
    } catch {
      setModuleError("Falha ao conectar com o servidor.")
    } finally {
      setIsCreatingModule(false)
    }
  }

  const handleDeleteModule = async (moduleId: number) => {
    if (!course) return
    const confirmed = window.confirm("Remover este modulo?")
    if (!confirmed) return

    setModuleError("")

    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setModuleError("Token nao encontrado. Faca login novamente.")
        return
      }

      const response = await fetch(`${API_BASE_URL}/courses/admin/modules/${moduleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const { data, raw } = await readJsonResponse<{ detail?: unknown }>(response)
      if (!response.ok) {
        setModuleError(resolveApiError(raw, data, "Erro ao remover modulo."))
        return
      }

      setCourse((prev) =>
        prev
          ? {
              ...prev,
              modules: prev.modules.filter((module) => module.id !== moduleId)
            }
          : prev
      )
    } catch {
      setModuleError("Falha ao conectar com o servidor.")
    }
  }

  const handleDeleteCourse = async () => {
    if (!course || isDeletingCourse) return
    const confirmed = window.confirm("Tem certeza que deseja excluir este curso?")
    if (!confirmed) return

    setDeleteError("")
    setIsDeletingCourse(true)

    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setDeleteError("Token nao encontrado. Faca login novamente.")
        return
      }

      const response = await fetch(`${API_BASE_URL}/courses/admin/courses/${course.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const { data, raw } = await readJsonResponse<{ detail?: unknown }>(response)
      if (!response.ok) {
        setDeleteError(resolveApiError(raw, data, "Erro ao excluir curso."))
        return
      }

      router.push("/admin/cursos")
    } catch {
      setDeleteError("Falha ao conectar com o servidor.")
    } finally {
      setIsDeletingCourse(false)
    }
  }

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }))
  }

  if (isLoading) {
    return (
      <div className="border border-border bg-card p-8 text-center">
        <BookOpen className="h-12 w-12 text-[#6b7a5f] mx-auto mb-3" />
        <p className="text-[#6b7a5f]">Carregando curso...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => router.push("/admin/cursos")}
        className="flex items-center gap-2 text-[#6b7a5f] hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm uppercase tracking-wider">Voltar para Cursos</span>
      </button>

      {loadError && (
        <div className="border border-border bg-card p-4 text-sm text-red-500 mb-6">
          {loadError}
        </div>
      )}

      {course && (
        <>
          {/* Course Header */}
          <div className="border border-border bg-card p-4 mb-6 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Thumbnail */}
              <div className="w-full lg:w-64 aspect-video bg-secondary border border-border flex items-center justify-center shrink-0">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 text-[#6b7a5f] mx-auto mb-1" />
                    <span className="text-xs text-[#6b7a5f]">Sem thumbnail</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col items-start justify-between gap-3 mb-4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <span className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                      {course.code}
                    </span>
                    <h1 className="text-2xl font-bold text-foreground">{course.name}</h1>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs px-2 py-1 uppercase tracking-wider ${
                        course.is_active
                          ? "text-green-500 bg-green-500/10"
                          : "text-yellow-500 bg-yellow-500/10"
                      }`}
                    >
                      {course.is_active ? "ativo" : "inativo"}
                    </span>
                    <Switch
                      checked={course.is_active}
                      onCheckedChange={handleToggleActive}
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <div
                  className="text-[#6b7a5f] mb-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: course.description }}
                />
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-[#6b7a5f]">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#6b7a5f]">
                    <BookOpen className="h-4 w-4" />
                    <span>{modules.length} modulos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Course */}
          <div className="border border-border bg-card p-4 mb-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                  Nome do Curso
                </label>
                <Input
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  className="border-border bg-secondary rounded-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                  Codigo
                </label>
                <Input
                  value={draft.code}
                  onChange={(event) =>
                    setDraft({ ...draft, code: event.target.value.toUpperCase() })
                  }
                  className="border-border bg-secondary rounded-none uppercase"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                  Carga Horaria
                </label>
                <Input
                  value={draft.duration}
                  onChange={(event) => setDraft({ ...draft, duration: event.target.value })}
                  className="border-border bg-secondary rounded-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                  URL da Thumbnail
                </label>
                <Input
                  value={draft.thumbnail_url}
                  onChange={(event) =>
                    setDraft({ ...draft, thumbnail_url: event.target.value })
                  }
                  className="border-border bg-secondary rounded-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <RichTextEditor
                label="Manual tatico"
                value={draft.description}
                onChange={(value) => setDraft({ ...draft, description: value })}
                placeholder="Descreva o manual tatico completo do curso..."
              />
            </div>

            {saveError && <p className="text-xs text-red-500 mt-3">{saveError}</p>}

            <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                onClick={handleDeleteCourse}
                disabled={isDeletingCourse}
                className="border-border rounded-none text-red-500 hover:text-red-600"
              >
                {isDeletingCourse ? "Excluindo..." : "Excluir Curso"}
              </Button>
              <Button
                onClick={handleSaveCourse}
                disabled={isSaving || !draft.name || !draft.code}
                className="bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar Alteracoes"}
              </Button>
            </div>
            {deleteError && <p className="text-xs text-red-500 mt-3">{deleteError}</p>}
          </div>

          {/* Modules Section Header */}
          <div className="flex flex-col items-start justify-between gap-3 mb-4 sm:flex-row sm:items-center">
            <h2 className="text-lg font-bold text-foreground">Modulos</h2>
            <Button
              onClick={() => setShowAddModuleModal(true)}
              className="bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Modulo
            </Button>
          </div>

          {moduleError && (
            <p className="text-xs text-red-500 mb-4">{moduleError}</p>
          )}

          {/* Modules List */}
          <div className="space-y-4">
            {modules.length === 0 && (
              <div className="border border-border bg-card p-4 text-xs text-[#6b7a5f]">
                Nenhum modulo cadastrado ainda.
              </div>
            )}
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="border border-border bg-card">
                <div
                  className="flex flex-col justify-between gap-3 p-4 cursor-pointer hover:bg-secondary/30 transition-colors sm:flex-row sm:items-center"
                  onClick={() => toggleModule(module.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <GripVertical className="h-4 w-4 text-[#6b7a5f] cursor-grab" />
                    <div className="flex h-8 w-8 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10 text-sm font-bold text-[#F4511E]">
                      {moduleIndex + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground">{module.title}</h3>
                      <p className="text-xs text-[#6b7a5f]">Ordem {module.order}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDeleteModule(module.id)
                      }}
                      className="p-2 text-[#6b7a5f] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {expandedModules[module.id] ? (
                      <ChevronUp className="h-5 w-5 text-[#6b7a5f]" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-[#6b7a5f]" />
                    )}
                  </div>
                </div>

                {expandedModules[module.id] && (
                  <div className="border-t border-border p-4 text-sm text-[#6b7a5f]">
                    {module.description || "Sem descricao."}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Module Modal */}
      {showAddModuleModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-lg my-8 max-h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
                  <BookOpen className="h-5 w-5 text-[#F4511E]" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Novo Modulo</h2>
                  <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Adicionar modulo ao curso
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModuleModal(false)}
                className="text-[#6b7a5f] hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 min-h-0 overflow-y-auto">
              <div>
                <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                  Titulo do Modulo *
                </label>
                <Input
                  value={newModule.title}
                  onChange={(event) => setNewModule({ ...newModule, title: event.target.value })}
                  className="border-border bg-secondary rounded-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                  Descricao
                </label>
                <Textarea
                  value={newModule.description}
                  onChange={(event) =>
                    setNewModule({ ...newModule, description: event.target.value })
                  }
                  className="border-border bg-secondary rounded-none"
                  rows={4}
                />
              </div>
              {moduleError && <p className="text-xs text-red-500">{moduleError}</p>}
            </div>

            <div className="flex flex-col-reverse gap-3 p-4 border-t border-border sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setShowAddModuleModal(false)}
                className="flex-1 border-border rounded-none"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddModule}
                disabled={!newModule.title || isCreatingModule}
                className="flex-1 bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none disabled:opacity-50"
              >
                {isCreatingModule ? "Criando..." : "Criar Modulo"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
