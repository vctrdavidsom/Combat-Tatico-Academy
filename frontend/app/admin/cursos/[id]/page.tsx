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
import { normalizeGoogleDriveDownloadUrl } from "@/lib/links"

type ApiModule = {
  id: number
  title: string
  description?: string | null
  order: number
  course_id: number
  lessons: ApiLesson[]
  exams: ApiExam[]
}

type ApiLesson = {
  id: number
  title: string
  type: "video" | "material"
  video_id?: string | null
  duration?: string | null
  material_pdf_url?: string | null
  material_link_url?: string | null
  order: number
  is_active: boolean
  module_id: number
}

type ApiQuestion = {
  id: number
  type: "multiple" | "essay"
  prompt: string
  options?: string[]
  correct_index?: number | null
  weight?: number | null
  order: number
}

type ApiExam = {
  id: number
  title: string
  type: "activity" | "module" | "final"
  draw_count: number
  attempt_limit: number
  total_points?: number | null
  cut_score?: number | null
  duration_minutes?: number | null
  start_date?: string | null
  due_date?: string | null
  is_active: boolean
  module_id: number
  questions: ApiQuestion[]
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
  final_exam?: ApiExam | null
}

type NewLessonDraft = {
  title: string
  type: "video" | "material"
  video_id: string
  duration: string
  material_pdf_url: string
  material_link_url: string
  is_active: boolean
}

type NewQuestionDraft = {
  prompt: string
  type: "multiple" | "essay"
  weight: string
  options: string[]
  correctIndex: number | null
}

type NewExamDraft = {
  title: string
  type: "activity" | "module" | "final"
  attempt_limit: string
  total_points: string
  cut_score: string
  duration_minutes: string
  start_date: string
  due_date: string
  is_active: boolean
  questions: NewQuestionDraft[]
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

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 16)
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
  const [contentError, setContentError] = useState("")
  const [isDeletingCourse, setIsDeletingCourse] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null)
  const [showAddLessonModal, setShowAddLessonModal] = useState(false)
  const [showAddExamModal, setShowAddExamModal] = useState(false)
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null)
  const [editingExamId, setEditingExamId] = useState<number | null>(null)
  const [newLesson, setNewLesson] = useState<NewLessonDraft>({
    title: "",
    type: "video",
    video_id: "",
    duration: "",
    material_pdf_url: "",
    material_link_url: "",
    is_active: true
  })
  const [newExam, setNewExam] = useState<NewExamDraft>({
    title: "",
    type: "activity",
    attempt_limit: "0",
    total_points: "",
    cut_score: "",
    duration_minutes: "",
    start_date: "",
    due_date: "",
    is_active: true,
    questions: []
  })
  const [isCreatingContent, setIsCreatingContent] = useState(false)

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
        const normalizedModules = (resolved.modules || []).map((module) => ({
          ...module,
          lessons: module.lessons || [],
          exams: module.exams || []
        }))
        setCourse({ ...resolved, modules: normalizedModules })
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
      const createdWithContent: ApiModule = {
        ...created,
        lessons: [],
        exams: []
      }
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              modules: [...prev.modules, createdWithContent]
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

  const openAddLessonModal = (moduleId: number) => {
    setActiveModuleId(moduleId)
    setContentError("")
    setEditingLessonId(null)
    setNewLesson({
      title: "",
      type: "video",
      video_id: "",
      duration: "",
      material_pdf_url: "",
      material_link_url: "",
      is_active: true
    })
    setShowAddLessonModal(true)
  }

  const openEditLessonModal = (moduleId: number, lesson: ApiLesson) => {
    setActiveModuleId(moduleId)
    setContentError("")
    setEditingLessonId(lesson.id)
    setNewLesson({
      title: lesson.title,
      type: lesson.type,
      video_id: lesson.video_id ?? "",
      duration: lesson.duration ?? "",
      material_pdf_url: lesson.material_pdf_url ?? "",
      material_link_url: lesson.material_link_url ?? "",
      is_active: lesson.is_active
    })
    setShowAddLessonModal(true)
  }

  const openAddExamModal = (moduleId: number) => {
    setActiveModuleId(moduleId)
    setContentError("")
    setEditingExamId(null)
    setNewExam({
      title: "",
      type: "activity",
      attempt_limit: "0",
      total_points: "",
      cut_score: "",
      duration_minutes: "",
      start_date: "",
      due_date: "",
      is_active: true,
      questions: []
    })
    setShowAddExamModal(true)
  }

  const openEditExamModal = (moduleId: number, exam: ApiExam) => {
    setActiveModuleId(moduleId)
    setContentError("")
    setEditingExamId(exam.id)
    setNewExam({
      title: exam.title,
      type: exam.type,
      attempt_limit: String(exam.attempt_limit ?? 0),
      total_points: exam.total_points != null ? String(exam.total_points) : "",
      cut_score: exam.cut_score != null ? String(exam.cut_score) : "",
      duration_minutes: exam.duration_minutes != null ? String(exam.duration_minutes) : "",
      start_date: toDateTimeLocal(exam.start_date),
      due_date: toDateTimeLocal(exam.due_date),
      is_active: exam.is_active,
      questions: exam.questions.map((question) => ({
        prompt: question.prompt,
        type: question.type,
        weight: question.weight != null ? String(question.weight) : "1",
        options: question.options || ["", ""],
        correctIndex: question.correct_index ?? 0
      }))
    })
    setShowAddExamModal(true)
  }

  const handleSaveLesson = async () => {
    if (!course || !activeModuleId || !newLesson.title || isCreatingContent) return
    setContentError("")
    setIsCreatingContent(true)

    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setContentError("Token nao encontrado. Faca login novamente.")
        return
      }

      const targetModule = course.modules.find((module) => module.id === activeModuleId)
      const nextOrder = targetModule?.lessons?.length
        ? Math.max(...targetModule.lessons.map((lesson) => lesson.order)) + 1
        : 1
      const editingLesson = editingLessonId
        ? course.modules.flatMap((module) => module.lessons).find((lesson) => lesson.id === editingLessonId)
        : null

      const isEditing = editingLessonId !== null
      const payload = {
        title: newLesson.title,
        type: newLesson.type,
        video_id: newLesson.type === "video" ? newLesson.video_id || null : null,
        duration: newLesson.duration || null,
        material_pdf_url: newLesson.type === "material" ? newLesson.material_pdf_url || null : null,
        material_link_url: newLesson.type === "material" ? newLesson.material_link_url || null : null,
        order: isEditing ? editingLesson?.order ?? nextOrder : nextOrder,
        is_active: newLesson.is_active
      }

      const endpoint = isEditing
        ? `${API_BASE_URL}/lessons/admin/lessons/${editingLessonId}`
        : `${API_BASE_URL}/lessons/admin/modules/${activeModuleId}/lessons`
      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const { data, raw } = await readJsonResponse<ApiLesson | { detail?: unknown }>(response)
      if (!response.ok) {
        setContentError(resolveApiError(raw, data, "Erro ao criar aula."))
        return
      }

      const created = data as ApiLesson
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              modules: prev.modules.map((module) => {
                if (module.id !== created.module_id) return module
                if (isEditing) {
                  return {
                    ...module,
                    lessons: module.lessons.map((lesson) =>
                      lesson.id === created.id ? created : lesson
                    )
                  }
                }
                return { ...module, lessons: [...module.lessons, created] }
              })
            }
          : prev
      )
      await loadCourse()
      setEditingLessonId(null)
      setShowAddLessonModal(false)
    } catch {
      setContentError("Falha ao conectar com o servidor.")
    } finally {
      setIsCreatingContent(false)
    }
  }

  const handleDeleteLesson = async (lessonId: number) => {
    if (!course) return
    const confirmed = window.confirm("Remover esta aula?")
    if (!confirmed) return

    setContentError("")
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setContentError("Token nao encontrado. Faca login novamente.")
        return
      }

      const response = await fetch(`${API_BASE_URL}/lessons/admin/lessons/${lessonId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const { data, raw } = await readJsonResponse<{ detail?: unknown }>(response)
      if (!response.ok) {
        setContentError(resolveApiError(raw, data, "Erro ao remover aula."))
        return
      }

      setCourse((prev) =>
        prev
          ? {
              ...prev,
              modules: prev.modules.map((module) => ({
                ...module,
                lessons: module.lessons.filter((lesson) => lesson.id !== lessonId)
              }))
            }
          : prev
      )
    } catch {
      setContentError("Falha ao conectar com o servidor.")
    }
  }

  const handleSaveExam = async () => {
    if (!course || !activeModuleId || !newExam.title || isCreatingContent) return
    setContentError("")
    setIsCreatingContent(true)

    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setContentError("Token nao encontrado. Faca login novamente.")
        return
      }

      const questionsPayload = newExam.questions
        .filter((question) => question.prompt.trim())
        .map((question, index) => {
          const options = question.type === "multiple"
            ? question.options.map((option) => option.trim()).filter(Boolean)
            : []
          const correct_index =
            question.type === "multiple" && question.correctIndex !== null
              ? question.correctIndex
              : null
          return {
            type: question.type,
            prompt: question.prompt.trim(),
            options,
            correct_index,
            weight: Number(question.weight || 1) || 1,
            order: index + 1
          }
        })

      const payload = {
        title: newExam.title,
        type: newExam.type,
        draw_count: 0,
        attempt_limit: Number(newExam.attempt_limit || 0) || 0,
        total_points: newExam.total_points ? Number(newExam.total_points) : null,
        cut_score: newExam.cut_score ? Number(newExam.cut_score) : null,
        duration_minutes: newExam.duration_minutes ? Number(newExam.duration_minutes) : null,
        start_date: newExam.start_date || null,
        due_date: newExam.due_date || null,
        is_active: newExam.is_active,
        questions: questionsPayload
      }

      const isEditing = editingExamId !== null
      const endpoint = isEditing
        ? `${API_BASE_URL}/exams/admin/exams/${editingExamId}`
        : `${API_BASE_URL}/exams/admin/modules/${activeModuleId}/exams`
      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const { data, raw } = await readJsonResponse<ApiExam | { detail?: unknown }>(response)
      if (!response.ok) {
        setContentError(resolveApiError(raw, data, "Erro ao criar atividade."))
        return
      }

      const updated = data as ApiExam
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              final_exam: updated.type === "final" ? updated : prev.final_exam,
              modules: prev.modules.map((module) => {
                if (module.id !== activeModuleId) return module
                if (isEditing) {
                  return {
                    ...module,
                    exams: module.exams.map((exam) => (exam.id === updated.id ? updated : exam))
                  }
                }
                return { ...module, exams: [...module.exams, updated] }
              })
            }
          : prev
      )
      await loadCourse()
      setEditingExamId(null)
      setShowAddExamModal(false)
    } catch {
      setContentError("Falha ao conectar com o servidor.")
    } finally {
      setIsCreatingContent(false)
    }
  }

  const handleDeleteExam = async (examId: number) => {
    if (!course) return
    const confirmed = window.confirm("Remover esta atividade?")
    if (!confirmed) return

    setContentError("")
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setContentError("Token nao encontrado. Faca login novamente.")
        return
      }

      const response = await fetch(`${API_BASE_URL}/exams/admin/exams/${examId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const { data, raw } = await readJsonResponse<{ detail?: unknown }>(response)
      if (!response.ok) {
        setContentError(resolveApiError(raw, data, "Erro ao remover atividade."))
        return
      }

      setCourse((prev) =>
        prev
          ? {
              ...prev,
              modules: prev.modules.map((module) => ({
                ...module,
                exams: module.exams.filter((exam) => exam.id !== examId)
              }))
            }
          : prev
      )
      await loadCourse()
    } catch {
      setContentError("Falha ao conectar com o servidor.")
    }
  }

  const addExamQuestion = () => {
    setNewExam((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          prompt: "",
          type: "multiple",
          weight: "1",
          options: ["", ""],
          correctIndex: 0
        }
      ]
    }))
  }

  const updateExamQuestion = (index: number, patch: Partial<NewQuestionDraft>) => {
    setNewExam((prev) => ({
      ...prev,
      questions: prev.questions.map((question, qIndex) =>
        qIndex === index ? { ...question, ...patch } : question
      )
    }))
  }

  const removeExamQuestion = (index: number) => {
    setNewExam((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, qIndex) => qIndex !== index)
    }))
  }

  const addQuestionOption = (questionIndex: number) => {
    setNewExam((prev) => ({
      ...prev,
      questions: prev.questions.map((question, qIndex) =>
        qIndex === questionIndex
          ? { ...question, options: [...question.options, ""] }
          : question
      )
    }))
  }

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    setNewExam((prev) => ({
      ...prev,
      questions: prev.questions.map((question, qIndex) =>
        qIndex === questionIndex
          ? {
              ...question,
              options: question.options.map((option, oIndex) =>
                oIndex === optionIndex ? value : option
              )
            }
          : question
      )
    }))
  }

  const removeQuestionOption = (questionIndex: number, optionIndex: number) => {
    setNewExam((prev) => ({
      ...prev,
      questions: prev.questions.map((question, qIndex) => {
        if (qIndex !== questionIndex) return question
        const nextOptions = question.options.filter((_, oIndex) => oIndex !== optionIndex)
        const nextCorrect =
          question.correctIndex === null
            ? null
            : question.correctIndex >= nextOptions.length
              ? nextOptions.length - 1
              : question.correctIndex
        return {
          ...question,
          options: nextOptions,
          correctIndex: nextOptions.length ? nextCorrect : null
        }
      })
    }))
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
                  <div className="border-t border-border p-4 text-sm text-[#6b7a5f] space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#6b7a5f]">Descricao</p>
                      <p className="text-sm text-foreground">{module.description || "Sem descricao."}</p>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs uppercase tracking-wider text-[#6b7a5f]">Aulas</p>
                          <Button
                            onClick={() => openAddLessonModal(module.id)}
                            className="bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none text-xs"
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            Nova aula
                          </Button>
                        </div>
                        {module.lessons.length === 0 ? (
                          <p className="text-xs text-[#6b7a5f]">Nenhuma aula cadastrada.</p>
                        ) : (
                          <div className="space-y-2">
                            {module.lessons
                              .slice()
                              .sort((a, b) => a.order - b.order)
                              .map((lesson) => (
                                <div key={lesson.id} className="border border-border p-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-[10px] uppercase tracking-wider text-[#6b7a5f]">
                                        {lesson.type === "video" ? "Video" : "Material"} • Ordem {lesson.order}
                                      </p>
                                      <p className="text-sm text-foreground">{lesson.title}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => openEditLessonModal(module.id, lesson)}
                                        className="text-[10px] uppercase tracking-wider text-[#F4511E]"
                                      >
                                        Editar
                                      </button>
                                      <button
                                        onClick={() => handleDeleteLesson(lesson.id)}
                                        className="text-[10px] uppercase tracking-wider text-red-500"
                                      >
                                        Excluir
                                      </button>
                                      <span
                                        className={`text-[10px] uppercase tracking-wider ${
                                          lesson.is_active ? "text-green-400" : "text-yellow-400"
                                        }`}
                                      >
                                        {lesson.is_active ? "ativo" : "inativo"}
                                      </span>
                                    </div>
                                  </div>
                                  {lesson.type === "video" && lesson.video_id && (
                                    <p className="text-[10px] text-[#6b7a5f] mt-1">Video ID: {lesson.video_id}</p>
                                  )}
                                  {lesson.type === "material" && lesson.material_pdf_url && (
                                    <p className="text-[10px] text-[#6b7a5f] mt-1">PDF: {lesson.material_pdf_url}</p>
                                  )}
                                  {lesson.type === "material" && lesson.material_link_url && (
                                    <p className="text-[10px] text-[#6b7a5f]">Link: {lesson.material_link_url}</p>
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs uppercase tracking-wider text-[#6b7a5f]">Atividades</p>
                          <Button
                            onClick={() => openAddExamModal(module.id)}
                            className="bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none text-xs"
                          >
                            <Plus className="h-3 w-3 mr-2" />
                            Nova atividade
                          </Button>
                        </div>
                        {module.exams.length === 0 ? (
                          <p className="text-xs text-[#6b7a5f]">Nenhuma atividade cadastrada.</p>
                        ) : (
                          <div className="space-y-2">
                            {module.exams.map((exam) => (
                              <div key={exam.id} className="border border-border p-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider text-[#6b7a5f]">
                                      {exam.type === "final" ? "Exame final" : "Atividade"} • Tentativas {exam.attempt_limit}
                                    </p>
                                    <p className="text-sm text-foreground">{exam.title}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => openEditExamModal(module.id, exam)}
                                      className="text-[10px] uppercase tracking-wider text-[#F4511E]"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => handleDeleteExam(exam.id)}
                                      className="text-[10px] uppercase tracking-wider text-red-500"
                                    >
                                      Excluir
                                    </button>
                                    <span
                                      className={`text-[10px] uppercase tracking-wider ${
                                        exam.is_active ? "text-green-400" : "text-yellow-400"
                                      }`}
                                    >
                                      {exam.is_active ? "ativo" : "inativo"}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[10px] text-[#6b7a5f] mt-1">
                                  {exam.questions.length} perguntas • Pontos {exam.total_points ?? "--"}
                                </p>
                                <p className="text-[10px] text-[#6b7a5f]">
                                  Inicio: {exam.start_date ? new Date(exam.start_date).toLocaleString("pt-BR") : "--"}
                                </p>
                                <p className="text-[10px] text-[#6b7a5f]">
                                  Limite: {exam.due_date ? new Date(exam.due_date).toLocaleString("pt-BR") : "--"}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
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

      {showAddLessonModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-lg my-8 max-h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="font-bold text-foreground">
                  {editingLessonId ? "Editar Aula" : "Nova Aula"}
                </h2>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                  {editingLessonId ? "Atualizar conteudo" : "Adicionar conteudo"}
                </p>
              </div>
              <button
                onClick={() => setShowAddLessonModal(false)}
                className="text-[#6b7a5f] hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 min-h-0 overflow-y-auto">
              <div>
                <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                  Titulo da aula *
                </label>
                <Input
                  value={newLesson.title}
                  onChange={(event) => setNewLesson({ ...newLesson, title: event.target.value })}
                  className="border-border bg-secondary rounded-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                  Tipo
                </label>
                <select
                  value={newLesson.type}
                  onChange={(event) =>
                    setNewLesson({ ...newLesson, type: event.target.value as "video" | "material" })
                  }
                  className="w-full border border-border bg-secondary rounded-none px-3 py-2 text-sm"
                >
                  <option value="video">Video</option>
                  <option value="material">Material</option>
                </select>
              </div>

              {newLesson.type === "video" ? (
                <>
                  <div>
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      Video ID
                    </label>
                    <Input
                      value={newLesson.video_id}
                      onChange={(event) => setNewLesson({ ...newLesson, video_id: event.target.value })}
                      className="border-border bg-secondary rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      Duracao
                    </label>
                    <Input
                      value={newLesson.duration}
                      onChange={(event) => setNewLesson({ ...newLesson, duration: event.target.value })}
                      className="border-border bg-secondary rounded-none"
                      placeholder="Ex: 12:30"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      URL do PDF
                    </label>
                    <Input
                      value={newLesson.material_pdf_url}
                      onChange={(event) =>
                        setNewLesson({
                          ...newLesson,
                          material_pdf_url: normalizeGoogleDriveDownloadUrl(event.target.value)
                        })
                      }
                      className="border-border bg-secondary rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      Link adicional
                    </label>
                    <Input
                      value={newLesson.material_link_url}
                      onChange={(event) =>
                        setNewLesson({ ...newLesson, material_link_url: event.target.value })
                      }
                      className="border-border bg-secondary rounded-none"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#6b7a5f]">Ativa</p>
                </div>
                <Switch
                  checked={newLesson.is_active}
                  onCheckedChange={(checked) => setNewLesson({ ...newLesson, is_active: checked })}
                />
              </div>
              {contentError && <p className="text-xs text-red-500">{contentError}</p>}
            </div>

            <div className="flex flex-col-reverse gap-3 p-4 border-t border-border sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setShowAddLessonModal(false)}
                className="flex-1 border-border rounded-none"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveLesson}
                disabled={!newLesson.title || isCreatingContent}
                className="flex-1 bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none disabled:opacity-50"
              >
                {isCreatingContent
                  ? "Salvando..."
                  : editingLessonId
                    ? "Salvar aula"
                    : "Criar aula"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showAddExamModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-3xl my-8 max-h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="font-bold text-foreground">
                  {editingExamId ? "Editar Atividade" : "Nova Atividade"}
                </h2>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">Adicionar avaliacao</p>
              </div>
              <button
                onClick={() => setShowAddExamModal(false)}
                className="text-[#6b7a5f] hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 min-h-0 overflow-y-auto">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    Titulo *
                  </label>
                  <Input
                    value={newExam.title}
                    onChange={(event) => setNewExam({ ...newExam, title: event.target.value })}
                    className="border-border bg-secondary rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    Tipo
                  </label>
                  <select
                    value={newExam.type}
                    onChange={(event) =>
                      setNewExam({ ...newExam, type: event.target.value as "activity" | "final" })
                    }
                    className="w-full border border-border bg-secondary rounded-none px-3 py-2 text-sm"
                  >
                    <option value="activity">Atividade</option>
                    <option value="final">Exame final</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    Tentativas
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={newExam.attempt_limit}
                    onChange={(event) =>
                      setNewExam({ ...newExam, attempt_limit: event.target.value })
                    }
                    className="border-border bg-secondary rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    Pontos totais
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    value={newExam.total_points}
                    onChange={(event) =>
                      setNewExam({ ...newExam, total_points: event.target.value })
                    }
                    className="border-border bg-secondary rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    Nota de corte (%)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={newExam.cut_score}
                    onChange={(event) => setNewExam({ ...newExam, cut_score: event.target.value })}
                    className="border-border bg-secondary rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    Duracao (min)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={newExam.duration_minutes}
                    onChange={(event) =>
                      setNewExam({ ...newExam, duration_minutes: event.target.value })
                    }
                    className="border-border bg-secondary rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    Inicio (opcional)
                  </label>
                  <Input
                    type="datetime-local"
                    value={newExam.start_date}
                    onChange={(event) =>
                      setNewExam({ ...newExam, start_date: event.target.value })
                    }
                    className="border-border bg-secondary rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    Limite (opcional)
                  </label>
                  <Input
                    type="datetime-local"
                    value={newExam.due_date}
                    onChange={(event) => setNewExam({ ...newExam, due_date: event.target.value })}
                    className="border-border bg-secondary rounded-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-[#6b7a5f]">Ativa</p>
                <Switch
                  checked={newExam.is_active}
                  onCheckedChange={(checked) => setNewExam({ ...newExam, is_active: checked })}
                />
              </div>

              <div className="border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-[#6b7a5f]">Perguntas</p>
                  <Button
                    onClick={addExamQuestion}
                    className="bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none text-xs"
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Adicionar pergunta
                  </Button>
                </div>
                {newExam.questions.length === 0 ? (
                  <p className="text-xs text-[#6b7a5f]">Nenhuma pergunta adicionada.</p>
                ) : (
                  <div className="space-y-3">
                    {newExam.questions.map((question, qIndex) => (
                      <div key={qIndex} className="border border-border p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs uppercase tracking-wider text-[#6b7a5f]">
                            Pergunta {qIndex + 1}
                          </p>
                          <button
                            onClick={() => removeExamQuestion(qIndex)}
                            className="text-xs text-red-500"
                          >
                            Remover
                          </button>
                        </div>
                        <Input
                          value={question.prompt}
                          onChange={(event) =>
                            updateExamQuestion(qIndex, { prompt: event.target.value })
                          }
                          className="border-border bg-secondary rounded-none"
                          placeholder="Enunciado da pergunta"
                        />
                        <div className="grid gap-3 md:grid-cols-3">
                          <select
                            value={question.type}
                            onChange={(event) =>
                              updateExamQuestion(qIndex, {
                                type: event.target.value as "multiple" | "essay",
                                options: event.target.value === "multiple" ? question.options : [],
                                correctIndex: event.target.value === "multiple" ? 0 : null
                              })
                            }
                            className="border border-border bg-secondary rounded-none px-3 py-2 text-sm"
                          >
                            <option value="multiple">Multipla escolha</option>
                            <option value="essay">Dissertativa</option>
                          </select>
                          <Input
                            type="number"
                            min={0}
                            step="0.1"
                            value={question.weight}
                            onChange={(event) =>
                              updateExamQuestion(qIndex, { weight: event.target.value })
                            }
                            className="border-border bg-secondary rounded-none"
                            placeholder="Peso"
                          />
                        </div>

                        {question.type === "multiple" && (
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${qIndex}`}
                                  checked={question.correctIndex === optionIndex}
                                  onChange={() =>
                                    updateExamQuestion(qIndex, { correctIndex: optionIndex })
                                  }
                                />
                                <Input
                                  value={option}
                                  onChange={(event) =>
                                    updateQuestionOption(qIndex, optionIndex, event.target.value)
                                  }
                                  className="border-border bg-secondary rounded-none"
                                  placeholder={`Opcao ${optionIndex + 1}`}
                                />
                                <button
                                  onClick={() => removeQuestionOption(qIndex, optionIndex)}
                                  className="text-xs text-red-500"
                                  type="button"
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                            <Button
                              onClick={() => addQuestionOption(qIndex)}
                              variant="outline"
                              className="border-border rounded-none text-xs"
                            >
                              Adicionar opcao
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {contentError && <p className="text-xs text-red-500">{contentError}</p>}
            </div>

            <div className="flex flex-col-reverse gap-3 p-4 border-t border-border sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setShowAddExamModal(false)}
                className="flex-1 border-border rounded-none"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveExam}
                disabled={!newExam.title || isCreatingContent}
                className="flex-1 bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none disabled:opacity-50"
              >
                {isCreatingContent
                  ? "Salvando..."
                  : editingExamId
                    ? "Salvar atividade"
                    : "Criar atividade"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
