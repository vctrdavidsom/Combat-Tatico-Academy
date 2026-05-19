"use client"

import { useState, type Dispatch, type SetStateAction } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  BookOpen,
  ArrowLeft,
  Plus,
  X,
  Play,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  Target,
  Award,
  GripVertical
} from "lucide-react"
import {
  useCombatContext,
  type Course,
  type Lesson,
  type Exam,
  type MaterialAttachment,
  type Question,
  type QuestionType
} from "@/contexts/CombatContext"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/admin/rich-text-editor"
import type { LibraryItem } from "@/lib/admin-library"

type MaterialKind = MaterialAttachment["kind"]
type ContentKind = "video" | "material" | "activity"

export default function AdminCourseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { listaCursos, bibliotecaArquivos, atualizarCurso } = useCombatContext()
  const courseId = Number(params.id)
  const course = listaCursos.find((item) => item.id === courseId) || listaCursos[0]
  const [showAddModuleModal, setShowAddModuleModal] = useState(false)
  const [showAddContentModal, setShowAddContentModal] = useState(false)
  const [showFinalExamModal, setShowFinalExamModal] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null)
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>(() =>
    course?.modules?.length ? { [course.modules[0].id]: true } : {}
  )
  
  const [newModule, setNewModule] = useState({ name: "", description: "" })
  const [newContentType, setNewContentType] = useState<ContentKind>("video")
  const [newContent, setNewContent] = useState({
    title: "",
    videoId: "",
    duration: "",
    materialPdfUrl: "",
    materialLinkUrl: ""
  })
  const [newActivityDrawCount, setNewActivityDrawCount] = useState(1)
  const [newActivityAttemptLimit, setNewActivityAttemptLimit] = useState(1)
  const [newActivityTotalPoints, setNewActivityTotalPoints] = useState(2)
  const [newQuestions, setNewQuestions] = useState<Question[]>([])
  const [newMaterials, setNewMaterials] = useState<MaterialAttachment[]>([])
  const [newFinalExam, setNewFinalExam] = useState({
    title: "Exame Final do Curso",
    cutScore: 70,
    durationMinutes: 60,
    drawCount: 10,
    attemptLimit: 2,
    totalPoints: 2
  })
  const [finalExamQuestions, setFinalExamQuestions] = useState<Question[]>([])

  const getNextId = (items: { id: number }[]) => {
    return Math.max(0, ...items.map((item) => item.id)) + 1
  }

  const addQuestion = (
    setQuestions: Dispatch<SetStateAction<Question[]>>
  ) => {
    setQuestions((prev) => [
      ...prev,
      {
        id: getNextId(prev),
        type: "multiple",
        prompt: "",
        options: ["", ""],
        correctIndex: 0,
        weight: 1
      }
    ])
  }

  const updateQuestion = (
    setQuestions: Dispatch<SetStateAction<Question[]>>,
    questionId: number,
    patch: Partial<Question>
  ) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId ? { ...question, ...patch } : question
      )
    )
  }

  const updateQuestionType = (
    setQuestions: Dispatch<SetStateAction<Question[]>>,
    questionId: number,
    type: QuestionType
  ) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) {
          return question
        }

        if (type === "essay") {
          return { ...question, type, options: [], correctIndex: undefined }
        }

        return {
          ...question,
          type,
          options: question.options.length ? question.options : ["", ""],
          correctIndex: question.correctIndex ?? 0
        }
      })
    )
  }

  const addOption = (
    setQuestions: Dispatch<SetStateAction<Question[]>>,
    questionId: number
  ) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) {
          return question
        }

        return { ...question, options: [...question.options, ""] }
      })
    )
  }

  const updateOption = (
    setQuestions: Dispatch<SetStateAction<Question[]>>,
    questionId: number,
    optionIndex: number,
    value: string
  ) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) {
          return question
        }

        const updatedOptions = question.options.map((option, index) =>
          index === optionIndex ? value : option
        )
        return { ...question, options: updatedOptions }
      })
    )
  }

  const removeOption = (
    setQuestions: Dispatch<SetStateAction<Question[]>>,
    questionId: number,
    optionIndex: number
  ) => {
    setQuestions((prev) =>
      prev.map((question) => {
        if (question.id !== questionId) {
          return question
        }

        const updatedOptions = question.options.filter(
          (_, index) => index !== optionIndex
        )
        const correctIndex =
          question.correctIndex !== undefined
            ? Math.max(0, Math.min(question.correctIndex, updatedOptions.length - 1))
            : undefined
        return { ...question, options: updatedOptions, correctIndex }
      })
    )
  }

  const removeQuestion = (
    setQuestions: Dispatch<SetStateAction<Question[]>>,
    questionId: number
  ) => {
    setQuestions((prev) => prev.filter((question) => question.id !== questionId))
  }

  const resetNewContent = () => {
    setNewContentType("video")
    setNewContent({
      title: "",
      videoId: "",
      duration: "",
      materialPdfUrl: "",
      materialLinkUrl: ""
    })
    setNewActivityDrawCount(1)
    setNewActivityAttemptLimit(1)
    setNewActivityTotalPoints(2)
    setNewQuestions([])
    setNewMaterials([])
  }

  const libraryItems = bibliotecaArquivos

  const updateCourse = (updater: (prev: Course) => Course) => {
    if (!course) return
    atualizarCurso(updater(course))
  }

  const applyLibraryToMaterial = (item: LibraryItem) => {
    if (item.type === "pdf") {
      setNewContent((prev) => ({ ...prev, materialPdfUrl: item.url }))
    } else {
      setNewContent((prev) => ({ ...prev, materialLinkUrl: item.url }))
    }
  }

  const addLibraryAttachmentToLesson = (item: LibraryItem) => {
    setNewMaterials((prev) => [
      ...prev,
      {
        id: getNextId(prev),
        name: item.title,
        kind: item.type,
        url: item.url
      }
    ])
  }

  const addMaterialAttachment = () => {
    setNewMaterials((prev) => [
      ...prev,
      {
        id: getNextId(prev),
        name: "",
        kind: "pdf",
        url: ""
      }
    ])
  }

  const updateMaterialAttachment = (
    attachmentId: number,
    patch: Partial<MaterialAttachment>
  ) => {
    setNewMaterials((prev) =>
      prev.map((attachment) =>
        attachment.id === attachmentId ? { ...attachment, ...patch } : attachment
      )
    )
  }

  const removeMaterialAttachment = (attachmentId: number) => {
    setNewMaterials((prev) => prev.filter((attachment) => attachment.id !== attachmentId))
  }

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }))
  }

  const handleAddModule = () => {
    if (newModule.name) {
      updateCourse((prev) => {
        const newId = Math.max(0, ...prev.modules.map((module) => module.id)) + 1
        return {
          ...prev,
          modules: [
            ...prev.modules,
            {
              id: newId,
              name: newModule.name,
              description: newModule.description,
              lessons: [],
              exams: []
            }
          ]
        }
      })
      setExpandedModules((prev) => ({ ...prev, [newId]: true }))
      setNewModule({ name: "", description: "" })
      setShowAddModuleModal(false)
    }
  }

  const handleAddContent = () => {
    if (!newContent.title || !selectedModuleId) {
      return
    }

    if (
      newContentType === "activity" &&
      (newQuestions.length < newActivityDrawCount || newActivityAttemptLimit < 1)
    ) {
      return
    }

    updateCourse((prev) => ({
      ...prev,
      modules: prev.modules.map((module) => {
        if (module.id !== selectedModuleId) {
          return module
        }

        const combined = [...module.lessons, ...module.exams]
        const newItemId = getNextId(combined)
        let newItem: Lesson | Exam

        if (newContentType === "video") {
          newItem = {
            id: newItemId,
            type: "video",
            title: newContent.title,
            videoId: newContent.videoId,
            duration: newContent.duration,
            materials: newMaterials
              .filter((attachment) => attachment.name || attachment.url)
              .map((attachment) => ({
                ...attachment,
                name: attachment.name || "Material",
                url: attachment.url || "#"
              }))
          }
        } else if (newContentType === "material") {
          newItem = {
            id: newItemId,
            type: "material",
            title: newContent.title,
            videoId: newContent.videoId,
            duration: newContent.duration,
            materialPdfUrl: newContent.materialPdfUrl,
            materialLinkUrl: newContent.materialLinkUrl
          }
        } else {
          const normalizedQuestions = normalizeQuestionWeights(
            newQuestions,
            newActivityTotalPoints
          )
          newItem = {
            id: newItemId,
            type: "activity",
            title: newContent.title,
            courseId: prev.id,
            moduleId: module.id,
            drawCount: newActivityDrawCount,
            attemptLimit: newActivityAttemptLimit,
            totalPoints: newActivityTotalPoints,
            questions: normalizedQuestions.map((question) => ({
              ...question,
              options: question.type === "multiple" ? question.options : []
            }))
          }
        }

        return {
          ...module,
          lessons:
            newItem.type === "video" || newItem.type === "material"
              ? [...module.lessons, newItem]
              : module.lessons,
          exams:
            newItem.type === "activity"
              ? [...module.exams, newItem]
              : module.exams
        }
      })
    }))
    resetNewContent()
    setSelectedModuleId(null)
    setShowAddContentModal(false)
  }

  const handleDeleteModule = (moduleId: number) => {
    updateCourse((prev) => ({
      ...prev,
      modules: prev.modules.filter((module) => module.id !== moduleId)
    }))
  }

  const handleDeleteItem = (moduleId: number, itemId: number, kind: "lesson" | "exam") => {
    updateCourse((prev) => ({
      ...prev,
      modules: prev.modules.map((module) => {
        if (module.id !== moduleId) {
          return module
        }

        return {
          ...module,
          lessons:
            kind === "lesson"
              ? module.lessons.filter((item) => item.id !== itemId)
              : module.lessons,
          exams:
            kind === "exam"
              ? module.exams.filter((item) => item.id !== itemId)
              : module.exams
        }
      })
    }))
  }

  const openAddContentModal = (moduleId: number) => {
    resetNewContent()
    setSelectedModuleId(moduleId)
    setShowAddContentModal(true)
  }

  const openFinalExamModal = () => {
    if (course.finalExam) {
      setNewFinalExam({
        title: course.finalExam.title,
        cutScore: course.finalExam.cutScore ?? 70,
        durationMinutes: course.finalExam.durationMinutes ?? 60,
        drawCount: course.finalExam.drawCount,
        attemptLimit: course.finalExam.attemptLimit,
        totalPoints: course.finalExam.totalPoints ?? 2
      })
      setFinalExamQuestions(course.finalExam.questions)
    } else {
      setNewFinalExam({
        title: "Exame Final do Curso",
        cutScore: 70,
        durationMinutes: 60,
        drawCount: 10,
        attemptLimit: 2,
        totalPoints: 2
      })
      setFinalExamQuestions([])
    }
    setShowFinalExamModal(true)
  }

  const handleSaveFinalExam = () => {
    if (!newFinalExam.title) {
      return
    }

    if (finalExamQuestions.length < newFinalExam.drawCount || newFinalExam.attemptLimit < 1) {
      return
    }

    const normalizedQuestions = normalizeQuestionWeights(
      finalExamQuestions,
      newFinalExam.totalPoints
    )
    updateCourse((prev) => ({
      ...prev,
      finalExam: {
        id: prev.finalExam?.id ?? 1,
        title: newFinalExam.title,
        type: "final",
        courseId: prev.id,
        cutScore: newFinalExam.cutScore,
        durationMinutes: newFinalExam.durationMinutes,
        drawCount: newFinalExam.drawCount,
        attemptLimit: newFinalExam.attemptLimit,
        totalPoints: newFinalExam.totalPoints,
        questions: normalizedQuestions.map((question) => ({
          ...question,
          options: question.type === "multiple" ? question.options : []
        }))
      }
    }))
    setShowFinalExamModal(false)
  }

  const handleRemoveFinalExam = () => {
    updateCourse((prev) => ({
      ...prev,
      finalExam: null
    }))
  }

  const getContentIcon = (type: ContentKind) => {
    switch (type) {
      case "video":
        return <Play className="h-3 w-3" />
      case "material":
        return <FileText className="h-3 w-3" />
      case "activity":
        return <Target className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  const getContentLabel = (type: ContentKind) => {
    switch (type) {
      case "video":
        return "Vídeo"
      case "material":
        return "Material"
      case "activity":
        return "Atividade"
      default:
        return "Conteúdo"
    }
  }

  const normalizeQuestionWeights = (questions: Question[], totalPoints: number) => {
    if (!questions.length) return questions
    const baseWeights = questions.map((question) => question.weight ?? 1)
    const sumWeights = baseWeights.reduce((sum, weight) => sum + weight, 0) || 1
    const factor = totalPoints > 0 ? totalPoints / sumWeights : 1
    return questions.map((question) => ({
      ...question,
      weight: Number(((question.weight ?? 1) * factor).toFixed(2))
    }))
  }

  const totalItems = course.modules.reduce(
    (acc, module) => acc + module.lessons.length + module.exams.length,
    0
  )
  const isContentValid =
    newContent.title &&
    (newContentType === "video"
      ? Boolean(newContent.videoId)
      : newContentType === "material"
        ? Boolean(newContent.materialPdfUrl || newContent.materialLinkUrl)
        : newQuestions.length >= newActivityDrawCount &&
          newActivityDrawCount > 0 &&
          newActivityAttemptLimit > 0 &&
          newActivityTotalPoints > 0)
  const isFinalExamValid =
    newFinalExam.title &&
    newFinalExam.drawCount > 0 &&
    newFinalExam.attemptLimit > 0 &&
    newFinalExam.totalPoints > 0 &&
    finalExamQuestions.length >= newFinalExam.drawCount

  const renderQuestionBuilder = (
    questions: Question[],
    setQuestions: Dispatch<SetStateAction<Question[]>>
  ) => (
    <div className="space-y-3">
      {questions.length === 0 && (
        <p className="text-xs text-[#6b7a5f]">
          Nenhuma pergunta adicionada ainda.
        </p>
      )}

      {questions.map((question) => (
        <div key={question.id} className="border border-border p-3 bg-secondary/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Digite o enunciado da pergunta..."
              value={question.prompt}
              onChange={(e) =>
                updateQuestion(setQuestions, question.id, { prompt: e.target.value })
              }
              className="border-border bg-secondary rounded-none"
            />
            <div className="flex items-center gap-2">
              <select
                value={question.type}
                onChange={(e) =>
                  updateQuestionType(
                    setQuestions,
                    question.id,
                    e.target.value as QuestionType
                  )
                }
                className="border border-border bg-secondary text-xs uppercase tracking-wider rounded-none px-2 py-2 text-[#6b7a5f]"
              >
                <option value="multiple">Múltipla</option>
                <option value="essay">Dissertativa</option>
              </select>
              <Input
                type="number"
                min={0}
                step="0.1"
                value={question.weight ?? 1}
                onChange={(e) =>
                  updateQuestion(setQuestions, question.id, {
                    weight: Number(e.target.value)
                  })
                }
                className="w-24 border-border bg-secondary rounded-none text-xs"
                placeholder="Peso"
              />
              <button
                type="button"
                onClick={() => removeQuestion(setQuestions, question.id)}
                className="p-2 text-[#6b7a5f] hover:text-red-500 transition-colors"
                title="Remover pergunta"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {question.type === "multiple" ? (
            <div className="mt-3 space-y-2">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label
                    htmlFor={`question-${question.id}-correct-${optionIndex}`}
                    className={`flex items-center gap-2 text-[10px] uppercase tracking-wider ${
                      question.correctIndex === optionIndex
                        ? "text-[#F4511E]"
                        : "text-[#6b7a5f]"
                    }`}
                    title="Marcar como correta"
                  >
                    <input
                      id={`question-${question.id}-correct-${optionIndex}`}
                      type="radio"
                      name={`question-${question.id}`}
                      checked={question.correctIndex === optionIndex}
                      onChange={() =>
                        updateQuestion(setQuestions, question.id, {
                          correctIndex: optionIndex
                        })
                      }
                      className="h-4 w-4 accent-[#F4511E]"
                    />
                    Correta
                  </label>
                  <Input
                    placeholder={`Alternativa ${optionIndex + 1}`}
                    value={option}
                    onChange={(e) =>
                      updateOption(setQuestions, question.id, optionIndex, e.target.value)
                    }
                    className={`border-border bg-secondary rounded-none ${
                      question.correctIndex === optionIndex
                        ? "border-[#F4511E]"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(setQuestions, question.id, optionIndex)}
                    className="p-2 text-[#6b7a5f] hover:text-red-500 transition-colors"
                    title="Remover alternativa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addOption(setQuestions, question.id)}
                className="border-border rounded-none"
              >
                Adicionar Alternativa
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-[#6b7a5f]">
              Resposta dissertativa livre (sem alternativas).
            </p>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => addQuestion(setQuestions)}
        className="border-border rounded-none w-full"
      >
        Adicionar Pergunta
      </Button>
    </div>
  )

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

        {/* Course Header */}
        <div className="border border-border bg-card p-4 mb-6 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Thumbnail */}
            <div className="w-full lg:w-64 aspect-video bg-secondary border border-border flex items-center justify-center shrink-0">
              {course.thumbnail ? (
                <img 
                  src={course.thumbnail} 
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
                  <span className={`text-xs px-2 py-1 uppercase tracking-wider ${
                    course.status === "ativo" 
                      ? "text-green-500 bg-green-500/10" 
                      : "text-yellow-500 bg-yellow-500/10"
                  }`}>
                    {course.status}
                  </span>
                  <Switch 
                    checked={course.status === "ativo"}
                    onCheckedChange={(checked) => {
                      updateCourse((prev) => ({
                        ...prev,
                        status: checked ? "ativo" : "rascunho"
                      }))
                    }}
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
                  <span>{course.totalHours}</span>
                </div>
                <div className="flex items-center gap-2 text-[#6b7a5f]">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.modules.length} módulos</span>
                </div>
                <div className="flex items-center gap-2 text-[#6b7a5f]">
                  <Play className="h-4 w-4" />
                  <span>{totalItems} conteúdos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <>
            <div className="border border-border bg-card p-4 mb-6">
              <RichTextEditor
                label="Manual tatico"
                value={course.description}
                onChange={(value) => {
                  updateCourse((prev) => ({ ...prev, description: value }))
                }}
                placeholder="Descreva o manual tatico completo do curso..."
              />
            </div>

            {/* Modules Section Header */}
            <div className="flex flex-col items-start justify-between gap-3 mb-4 sm:flex-row sm:items-center">
              <h2 className="text-lg font-bold text-foreground">Módulos e Conteúdos</h2>
              <Button 
                onClick={() => setShowAddModuleModal(true)}
                className="bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Módulo
              </Button>
            </div>

            {/* Modules List */}
            <div className="space-y-4">
              {course.modules.map((module, moduleIndex) => (
                <div key={module.id} className="border border-border bg-card">
              {/* Module Header */}
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
                    <h3 className="font-bold text-foreground">{module.name}</h3>
                    <p className="text-xs text-[#6b7a5f]">
                      {module.lessons.length + module.exams.length} conteúdos
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
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

              {/* Module Content - Items */}
              {expandedModules[module.id] && (
                <div className="border-t border-border">
                  {module.lessons.length === 0 && module.exams.length === 0 && (
                    <div className="p-4 text-xs text-[#6b7a5f]">
                      Nenhum conteúdo cadastrado neste módulo.
                    </div>
                  )}
                  {[...module.lessons.map((lesson) => ({ kind: "lesson" as const, data: lesson })),
                    ...module.exams.map((exam) => ({ kind: "exam" as const, data: exam }))
                  ].map((entry, itemIndex) => {
                    const item = entry.data
                    const itemType = entry.kind === "lesson" ? item.type : "activity"
                    return (
                      <div key={`${entry.kind}-${item.id}`} className="border-b border-border last:border-b-0">
                        <div className="flex flex-col justify-between gap-3 p-4 bg-secondary/20 sm:flex-row sm:items-start">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="flex h-6 w-6 items-center justify-center border border-[#6b7a5f] text-xs font-medium text-[#6b7a5f] mt-0.5">
                              {itemIndex + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="flex items-center gap-1 text-xs text-[#F4511E] uppercase tracking-wider">
                                  {getContentIcon(itemType)}
                                  {getContentLabel(itemType)}
                                </span>
                                <h4 className="font-medium text-foreground text-sm break-words">
                                  {item.title}
                                </h4>
                              </div>

                              {entry.kind === "lesson" && item.type === "video" && (
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#6b7a5f]">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {item.duration || "Sem duração"}
                                  </span>
                                  <span className="flex items-center gap-1 break-all">
                                    <Play className="h-3 w-3" />
                                    {item.videoId ? `YouTube ID: ${item.videoId}` : "YouTube ID não informado"}
                                  </span>
                                </div>
                              )}

                              {entry.kind === "lesson" && item.type === "video" && item.materials && item.materials.length > 0 && (
                                <div className="mt-2 space-y-1 text-xs text-[#6b7a5f]">
                                  <span className="text-[10px] uppercase tracking-wider text-[#6b7a5f]">
                                    Materiais da aula
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {item.materials.map((attachment) => (
                                      <div
                                        key={attachment.id}
                                        className="flex items-center gap-2 px-2 py-1 bg-secondary border border-border"
                                      >
                                        <FileText className="h-3 w-3" />
                                        <span className="break-words">
                                          {attachment.name} ({attachment.kind})
                                        </span>
                                        <span className="break-all text-[#F4511E]">
                                          {attachment.url}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {entry.kind === "lesson" && item.type === "material" && (
                                <div className="mt-2 space-y-1 text-xs text-[#6b7a5f]">
                                  <div className="flex flex-wrap items-center gap-2 break-all">
                                    <FileText className="h-3 w-3" />
                                    <span>
                                      {item.materialPdfUrl
                                        ? `PDF: ${item.materialPdfUrl}`
                                        : "PDF não informado"}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 break-all">
                                    <LinkIcon className="h-3 w-3" />
                                    <span>
                                      {item.materialLinkUrl
                                        ? `Link: ${item.materialLinkUrl}`
                                        : "Link não informado"}
                                    </span>
                                  </div>
                                  {item.videoId && (
                                    <div className="flex flex-wrap items-center gap-2 break-all">
                                      <Play className="h-3 w-3" />
                                      <span>YouTube ID: {item.videoId}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {entry.kind === "exam" && (
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#6b7a5f]">
                                  <span className="flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    Banco: {item.questions?.length ?? 0} perguntas
                                  </span>
                                  <span className="uppercase tracking-wider">
                                    Pontos: {item.totalPoints ?? 0}
                                  </span>
                                  <span className="uppercase tracking-wider">
                                    Sorteio: {item.drawCount ?? 0}
                                  </span>
                                  <span className="uppercase tracking-wider">
                                    Tentativas: {item.attemptLimit ?? 0}
                                  </span>
                                  <span className="uppercase tracking-wider">Questionário de apoio</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteItem(module.id, item.id, entry.kind)}
                              className="p-2 text-[#6b7a5f] hover:text-red-500 transition-colors"
                              title="Remover conteúdo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <div className="p-3">
                    <button
                      onClick={() => openAddContentModal(module.id)}
                      className="flex items-center gap-2 text-sm text-[#6b7a5f] hover:text-[#F4511E] transition-colors w-full justify-center py-2 border border-dashed border-border hover:border-[#F4511E]"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Conteúdo
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

              {course.modules.length === 0 && (
                <div className="border border-border bg-card p-8 text-center">
                  <BookOpen className="h-12 w-12 text-[#6b7a5f] mx-auto mb-3" />
                  <p className="text-[#6b7a5f] mb-4">Nenhum módulo cadastrado.</p>
                  <Button 
                    onClick={() => setShowAddModuleModal(true)}
                    className="bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Módulo
                  </Button>
                </div>
              )}
            </div>

            {/* Final Exam Section */}
            <div className="border border-border bg-card mt-8">
          <div className="p-4 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
                <Award className="h-5 w-5 text-[#F4511E]" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Exame Final</h3>
                <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                  Avaliacao obrigatoria do curso
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:justify-end sm:w-auto sm:ml-auto">
              {course.finalExam && (
                <Button
                  variant="outline"
                  onClick={handleRemoveFinalExam}
                  className="border-border rounded-none w-full sm:w-auto"
                >
                  Remover Exame
                </Button>
              )}
              <Button
                onClick={openFinalExamModal}
                className="bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none w-full sm:w-auto"
              >
                {course.finalExam ? "Editar Exame" : "Adicionar Exame Final"}
              </Button>
            </div>
          </div>

          {course.finalExam ? (
            <div className="p-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#6b7a5f]">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Nota de corte: {course.finalExam.cutScore}%
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tempo limite: {course.finalExam.durationMinutes} min
                </span>
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Banco: {course.finalExam.questions.length}
                </span>
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Sorteio: {course.finalExam.drawCount}
                </span>
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Tentativas: {course.finalExam.attemptLimit}
                </span>
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Pontos: {course.finalExam.totalPoints ?? 0}
                </span>
              </div>
              <p className="text-xs text-[#6b7a5f] mt-3">
                Este exame aparece ao final do curso e valida a conclusao.
              </p>
            </div>
          ) : (
            <div className="p-4 text-xs text-[#6b7a5f]">
              Nenhum exame final configurado.
            </div>
          )}
            </div>
        </>

      {/* Add Module Modal */}
      {showAddModuleModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-md max-h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
                  <BookOpen className="h-5 w-5 text-[#F4511E]" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Novo Módulo</h2>
                  <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Adicionar módulo ao curso
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
                  Nome do Módulo *
                </label>
                <Input
                  placeholder="Ex: Módulo 1: Fundamentos"
                  value={newModule.name}
                  onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                  className="border-border bg-secondary rounded-none"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                  Descrição
                </label>
                <Textarea
                  placeholder="Descrição breve do módulo..."
                  value={newModule.description}
                  onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                  className="border-border bg-secondary rounded-none min-h-[80px] resize-none"
                />
              </div>
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
                disabled={!newModule.name}
                className="flex-1 bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none disabled:opacity-50"
              >
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Content Modal */}
      {showAddContentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-2xl max-h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
                  <Play className="h-5 w-5 text-[#F4511E]" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Novo Conteúdo</h2>
                  <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Configurar vídeo, material ou atividade
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddContentModal(false)
                  setSelectedModuleId(null)
                }}
                className="text-[#6b7a5f] hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 min-h-0 overflow-y-auto">
              <div>
                <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                  Título do Conteúdo *
                </label>
                <Input
                  placeholder="Ex: Aula 1, Leitura Guiada, Questionário"
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  className="border-border bg-secondary rounded-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                  Tipo de Conteúdo
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {[
                    { value: "video", label: "Vídeo", icon: Play },
                    { value: "material", label: "Material", icon: FileText },
                    { value: "activity", label: "Atividade", icon: Target }
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setNewContentType(type.value as ContentType)
                        if (type.value !== "activity") {
                          setNewQuestions([])
                        }
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 border transition-colors ${
                        newContentType === type.value
                          ? "border-[#F4511E] bg-[#F4511E]/10 text-[#F4511E]"
                          : "border-border text-[#6b7a5f] hover:border-[#6b7a5f]"
                      }`}
                    >
                      <type.icon className="h-4 w-4" />
                      <span className="text-xs uppercase">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(newContentType === "video" || newContentType === "material") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      youtube_id {newContentType === "material" ? "(opcional)" : "*"}
                    </label>
                    <Input
                      placeholder="Ex: jyTUFvYLgUk"
                      value={newContent.videoId}
                      onChange={(e) => setNewContent({ ...newContent, videoId: e.target.value })}
                      className="border-border bg-secondary rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      Duração
                    </label>
                    <Input
                      placeholder="Ex: 45min"
                      value={newContent.duration}
                      onChange={(e) => setNewContent({ ...newContent, duration: e.target.value })}
                      className="border-border bg-secondary rounded-none"
                    />
                  </div>
                </div>
              )}

              {newContentType === "video" && (
                <p className="text-xs text-[#6b7a5f]">
                  O youtube_id é obrigatório para conteúdos de vídeo.
                </p>
              )}

              {newContentType === "video" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#F4511E]" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                      Materiais da aula
                    </h3>
                  </div>
                  {newMaterials.length === 0 && (
                    <p className="text-xs text-[#6b7a5f]">
                      Nenhum material anexado ainda.
                    </p>
                  )}
                  {newMaterials.map((attachment) => (
                    <div key={attachment.id} className="grid grid-cols-1 gap-2 md:grid-cols-[120px_1fr_1fr_auto]">
                      <select
                        value={attachment.kind}
                        onChange={(e) =>
                          updateMaterialAttachment(attachment.id, {
                            kind: e.target.value as MaterialKind
                          })
                        }
                        className="border border-border bg-secondary text-xs uppercase tracking-wider rounded-none px-2 py-2 text-[#6b7a5f]"
                      >
                        <option value="pdf">PDF</option>
                        <option value="link">Link</option>
                        <option value="file">Arquivo</option>
                      </select>
                      <Input
                        placeholder="Nome do material"
                        value={attachment.name}
                        onChange={(e) =>
                          updateMaterialAttachment(attachment.id, {
                            name: e.target.value
                          })
                        }
                        className="border-border bg-secondary rounded-none"
                      />
                      <Input
                        placeholder="URL do material"
                        value={attachment.url}
                        onChange={(e) =>
                          updateMaterialAttachment(attachment.id, {
                            url: e.target.value
                          })
                        }
                        className="border-border bg-secondary rounded-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeMaterialAttachment(attachment.id)}
                        className="p-2 text-[#6b7a5f] hover:text-red-500 transition-colors"
                        title="Remover material"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addMaterialAttachment}
                    className="border-border rounded-none w-full"
                  >
                    Adicionar Material
                  </Button>
                  <p className="text-xs text-[#6b7a5f]">
                    Materiais são opcionais e ficam ligados a esta aula.
                  </p>
                </div>
              )}

              {newContentType === "material" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      PDF (URL)
                    </label>
                    <Input
                      placeholder="https://..."
                      value={newContent.materialPdfUrl}
                      onChange={(e) => setNewContent({ ...newContent, materialPdfUrl: e.target.value })}
                      className="border-border bg-secondary rounded-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                      Link de Leitura
                    </label>
                    <Input
                      placeholder="https://..."
                      value={newContent.materialLinkUrl}
                      onChange={(e) => setNewContent({ ...newContent, materialLinkUrl: e.target.value })}
                      className="border-border bg-secondary rounded-none"
                    />
                  </div>
                </div>
              )}

              {(newContentType === "video" || newContentType === "material") && (
                <div className="border border-border bg-secondary/20 p-3 space-y-2">
                  <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Biblioteca Global
                  </p>
                  <div className="grid gap-2">
                    {libraryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border border-border bg-card px-3 py-2"
                      >
                        <div>
                          <p className="text-xs text-foreground">{item.title}</p>
                          <p className="text-[10px] text-[#6b7a5f] break-all">{item.url}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (newContentType === "material") {
                              applyLibraryToMaterial(item)
                            } else {
                              addLibraryAttachmentToLesson(item)
                            }
                          }}
                          className="border-border rounded-none text-xs"
                        >
                          {newContentType === "material" ? "Aplicar" : "Anexar"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {newContentType === "material" && (
                <p className="text-xs text-[#6b7a5f]">
                  Informe ao menos um PDF ou link de leitura. O vídeo é opcional.
                </p>
              )}

              {newContentType === "activity" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#F4511E]" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                      Construtor de Questões
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                        Quantidade sorteada para o aluno
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={newActivityDrawCount}
                        onChange={(e) => setNewActivityDrawCount(Number(e.target.value))}
                        className="border-border bg-secondary rounded-none"
                      />
                      <p className="text-xs text-[#6b7a5f] mt-2">
                        O banco precisa ter ao menos {newActivityDrawCount} questões.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                        Limite de tentativas
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={newActivityAttemptLimit}
                        onChange={(e) => setNewActivityAttemptLimit(Number(e.target.value))}
                        className="border-border bg-secondary rounded-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                        Valor total da atividade
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        value={newActivityTotalPoints}
                        onChange={(e) => setNewActivityTotalPoints(Number(e.target.value))}
                        className="border-border bg-secondary rounded-none"
                      />
                    </div>
                  </div>
                  {renderQuestionBuilder(newQuestions, setNewQuestions)}
                  {newQuestions.length < newActivityDrawCount && (
                    <p className="text-xs text-red-500">
                      Adicione mais questões para atingir o minimo configurado.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 p-4 border-t border-border sm:flex-row">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddContentModal(false)
                  setSelectedModuleId(null)
                }}
                className="flex-1 border-border rounded-none"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddContent}
                disabled={!isContentValid}
                className="flex-1 bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none disabled:opacity-50"
              >
                Adicionar Conteúdo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Final Exam Modal */}
      {showFinalExamModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-2xl max-h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
                  <Award className="h-5 w-5 text-[#F4511E]" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Exame Final</h2>
                  <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
                    Configurar prova de certificação
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFinalExamModal(false)}
                className="text-[#6b7a5f] hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 min-h-0 overflow-y-auto">
              <div>
                <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                  Título do Exame *
                </label>
                <Input
                  placeholder="Ex: Exame Final de Certificação"
                  value={newFinalExam.title}
                  onChange={(e) => setNewFinalExam({ ...newFinalExam, title: e.target.value })}
                  className="border-border bg-secondary rounded-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    Nota de Corte (%)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={newFinalExam.cutScore}
                    onChange={(e) =>
                      setNewFinalExam({
                        ...newFinalExam,
                        cutScore: Number(e.target.value)
                      })
                    }
                    className="border-border bg-secondary rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    Timer HUD (minutos)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={newFinalExam.durationMinutes}
                    onChange={(e) =>
                      setNewFinalExam({
                        ...newFinalExam,
                        durationMinutes: Number(e.target.value)
                      })
                    }
                    className="border-border bg-secondary rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    Quantidade sorteada para o aluno
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={newFinalExam.drawCount}
                    onChange={(e) =>
                      setNewFinalExam({
                        ...newFinalExam,
                        drawCount: Number(e.target.value)
                      })
                    }
                    className="border-border bg-secondary rounded-none"
                  />
                  <p className="text-xs text-[#6b7a5f] mt-2">
                    O banco precisa ter ao menos {newFinalExam.drawCount} questões.
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    Limite de tentativas
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={newFinalExam.attemptLimit}
                    onChange={(e) =>
                      setNewFinalExam({
                        ...newFinalExam,
                        attemptLimit: Number(e.target.value)
                      })
                    }
                    className="border-border bg-secondary rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
                    Valor total do exame
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    value={newFinalExam.totalPoints}
                    onChange={(e) =>
                      setNewFinalExam({
                        ...newFinalExam,
                        totalPoints: Number(e.target.value)
                      })
                    }
                    className="border-border bg-secondary rounded-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#F4511E]" />
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                    Questões do Exame
                  </h3>
                </div>
                {renderQuestionBuilder(finalExamQuestions, setFinalExamQuestions)}
                {finalExamQuestions.length < newFinalExam.drawCount && (
                  <p className="text-xs text-red-500">
                    Adicione mais questões para atingir o minimo configurado.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 p-4 border-t border-border sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setShowFinalExamModal(false)}
                className="flex-1 border-border rounded-none"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveFinalExam}
                disabled={!isFinalExamValid}
                className="flex-1 bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none disabled:opacity-50"
              >
                Salvar Exame
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
