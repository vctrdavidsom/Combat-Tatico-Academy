"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { initialLibraryItems, type LibraryItem } from "@/lib/admin-library"

export type QuestionType = "multiple" | "essay"

export type Question = {
  id: number
  type: QuestionType
  prompt: string
  options: string[]
  correctIndex?: number
  weight?: number
}

export type MaterialAttachment = {
  id: number
  name: string
  kind: "pdf" | "link" | "file"
  url: string
}

export type LessonType = "video" | "material"

export type Lesson = {
  id: number
  type: LessonType
  title: string
  videoId?: string
  duration?: string
  materialPdfUrl?: string
  materialLinkUrl?: string
  materials?: MaterialAttachment[]
}

export type ExamType = "activity" | "final"

export type Exam = {
  id: number
  title: string
  type: ExamType
  courseId?: number
  moduleId?: number
  cutScore?: number
  durationMinutes?: number
  drawCount: number
  attemptLimit: number
  questions: Question[]
  totalPoints?: number
}

export type CourseModule = {
  id: number
  name: string
  description: string
  lessons: Lesson[]
  exams: Exam[]
}

export type Course = {
  id: number
  code: string
  name: string
  description: string
  thumbnail: string
  totalHours: string
  status: string
  modules: CourseModule[]
  finalExam: Exam | null
}

export type Certificate = {
  id: number
  userId: number
  courseId: number
  fileUrl: string
}

export type NotificationSeverity = "info" | "critical"

export type NotificationScope = "user" | "global"

export type NotificationKind =
  | "LESSON_NEW"
  | "EXAM_GRADED"
  | "EXAM_AVAILABLE"
  | "GLOBAL_ALERT"

export type Notification = {
  id: number
  kind: NotificationKind
  title?: string
  message: string
  link: string
  read: boolean
  createdAt: string
  scope: NotificationScope
  severity: NotificationSeverity
}

export type UserDocumentStatus = "aguardando" | "validado" | "recusado"

export type UserDocument = {
  id: number
  name: string
  kind: "pdf" | "image"
  fileUrl: string
  status: UserDocumentStatus
  uploadedAt: string
}

export type UserRole = "admin" | "student"

export type User = {
  id: number
  name: string
  email: string
  password: string
  role: UserRole
  enrolledAt: string
  status: string
  phone: string
  cpf?: string
  courses: Record<number, boolean>
  certificate?: Certificate
  progress?: Record<number, number[]>
  notifications: Notification[]
  documents?: UserDocument[]
}

export type ExamAttempt = {
  id: number
  userId: number
  courseId: number
  examId: number
  moduleId?: number
  title: string
  examType: ExamType
  answers: Record<number, string | number>
  scorePercent: number
  scorePoints?: number
  totalPoints?: number
  hasEssay: boolean
  status: "pendente" | "corrigido"
  result: "apto" | "nao_apto"
  submittedAt: string
  attemptNumber: number
  maxAttempts?: number
  cutScore?: number
  feedback?: string
}

type CombatState = {
  listaAlunos: User[]
  listaCursos: Course[]
  bibliotecaArquivos: LibraryItem[]
  tentativasExames: ExamAttempt[]
  currentUserId: number | null
  currentRole: UserRole | null
}

type CombatContextValue = CombatState & {
  currentUser: User | null
  cadastrarAluno: (data: Omit<User, "id" | "courses" | "documents" | "notifications" | "progress" | "certificate"> & { courses?: Record<number, boolean>; documents?: UserDocument[] }) => void
  login: (credenciais: { email: string; password: string }) => { ok: boolean; role: UserRole | null }
  logout: () => void
  criarCurso: (payload: {
    code: string
    name: string
    description: string
    thumbnail: string
    totalHours: string
    status?: "ativo" | "rascunho"
  }) => void
  liberarCurso: (alunoId: number, cursoId: number) => void
  salvarConteudoPolimorfico: (cursoId: number, moduleId: number, item: Lesson | Exam) => void
  atualizarCurso: (curso: Course) => void
  lancarNota: (
    alunoId: number,
    exameId: number,
    nota: number,
    feedback?: string,
    scorePoints?: number,
    totalPoints?: number
  ) => void
  uploadCertificadoExterno: (alunoId: number, arquivo: Certificate) => void
  adicionarArquivoBiblioteca: (item: Omit<LibraryItem, "id" | "updatedAt">) => void
  atualizarArquivoBiblioteca: (itemId: number, patch: Partial<LibraryItem>) => void
  removerArquivoBiblioteca: (itemId: number) => void
  atualizarAluno: (alunoId: number, patch: Partial<User>) => void
  adicionarDocumentoAluno: (alunoId: number, payload: Omit<UserDocument, "id" | "status" | "uploadedAt"> & { status?: UserDocumentStatus }) => void
  validarDocumentoAluno: (alunoId: number, documentId: number, status: UserDocumentStatus) => void
  alterarSenhaAluno: (alunoId: number, senha: string) => void
  enviarMissao: (payload: {
    alunoId: number
    courseId: number
    examId: number
    moduleId?: number
    title: string
    examType: ExamType
    answers: Record<number, string | number>
    scorePercent: number
    scorePoints?: number
    totalPoints?: number
    hasEssay: boolean
    maxAttempts?: number
    cutScore?: number
  }) => void
  marcarAulaConcluida: (alunoId: number, cursoId: number, lessonId: number) => void
  criarAviso: (payload: { title: string; message: string; priority: NotificationSeverity }) => void
  addNotification: (payload: {
    alunoId: number
    kind: NotificationKind
    message: string
    link: string
    scope?: NotificationScope
    severity?: NotificationSeverity
  }) => void
  markAsRead: (alunoId: number, notificationId: number) => void
  marcarNotificacaoLida: (alunoId: number, notificationId: number) => void
}

const STORAGE_KEY = "cta_state_v1"
const ADMIN_EMAIL = "admin@combat.com"
const ADMIN_PASSWORD = "admin123"

const buildInitialCourses = (): Course[] => {
  return []
}

const buildInitialStudents = (): User[] => {
  const today = "04/05/2026"
  return [
    {
      id: 1,
      name: "Joao Silva",
      email: "joao.silva@email.com",
      password: "aluno123",
      role: "student",
      enrolledAt: "15/01/2024",
      status: "ativo",
      phone: "(11) 99999-1234",
      cpf: "123.456.789-00",
      courses: { 1: true, 2: true, 3: false },
      progress: { 1: [] },
      notifications: [],
      documents: []
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria.santos@email.com",
      password: "aluno123",
      role: "student",
      enrolledAt: "22/02/2024",
      status: "ativo",
      phone: "(11) 99999-5678",
      cpf: "987.654.321-00",
      courses: { 1: true, 2: false, 3: false },
      progress: { 1: [] },
      notifications: [],
      documents: []
    }
  ]
}

const initialState: CombatState = {
  listaAlunos: buildInitialStudents(),
  listaCursos: buildInitialCourses(),
  bibliotecaArquivos: initialLibraryItems,
  tentativasExames: [],
  currentUserId: null,
  currentRole: null
}

const normalizeNotifications = (notifications: Notification[] | undefined) => {
  if (!notifications) return []
  return notifications.map((item) => {
    const legacy = item as unknown as {
      id?: number
      kind?: string
      title?: string
      message?: string
      createdAt?: string
      read?: boolean
      tipo?: string
      mensagem?: string
      rota?: string
      lida?: boolean
      timestamp?: string
      scope?: NotificationScope
      severity?: NotificationSeverity
      link?: string
    }
    const kind =
      (legacy.kind as NotificationKind | undefined) ||
      (legacy.tipo === "AULA_NOVA"
        ? "LESSON_NEW"
        : legacy.tipo === "NOVA_ATIVIDADE"
          ? "EXAM_AVAILABLE"
          : legacy.tipo === "ATIVIDADE_CORRIGIDA"
            ? "EXAM_GRADED"
            : legacy.tipo === "BROADCAST_GERAL"
              ? "GLOBAL_ALERT"
              : "GLOBAL_ALERT")
    return {
      id: legacy.id ?? 0,
      kind,
      title: legacy.title,
      message: legacy.mensagem ?? legacy.message ?? legacy.title ?? "Atualizacao disponivel",
      link: legacy.link ?? legacy.rota ?? "/dashboard",
      read: legacy.lida ?? legacy.read ?? false,
      createdAt: legacy.timestamp ?? legacy.createdAt ?? new Date().toLocaleString("pt-BR"),
      scope:
        legacy.scope ?? (kind === "GLOBAL_ALERT" ? "global" : "user"),
      severity: legacy.severity ?? "info"
    }
  })
}

const normalizeState = (state: CombatState): CombatState => {
  const fallbackCourseId = state.listaCursos[0]?.id ?? 0
  return {
    ...state,
    listaAlunos: state.listaAlunos.map((student) => {
      const legacyCertificate = student.certificate as
        | Certificate
        | { name?: string; dataUrl?: string; courseId?: number }
        | undefined
      const certificate = legacyCertificate
        ? {
            id: (legacyCertificate as Certificate).id ?? student.id,
            userId: student.id,
            courseId: legacyCertificate.courseId ?? fallbackCourseId,
            fileUrl: legacyCertificate.fileUrl ?? legacyCertificate.dataUrl ?? ""
          }
        : undefined
      return {
        ...student,
        role: student.role ?? "student",
        enrolledAt: student.enrolledAt ?? (student as unknown as { enrolled?: string }).enrolled ?? "",
        courses: student.courses ?? {},
        progress: student.progress ?? {},
        notifications: normalizeNotifications(student.notifications),
        cpf: student.cpf ?? "",
        certificate,
        documents: (student.documents ?? []).map((doc) => ({
          ...doc,
          fileUrl: (doc as unknown as { dataUrl?: string }).dataUrl ?? doc.fileUrl
        }))
      }
    }),
    tentativasExames: state.tentativasExames.map((attempt) => ({
      ...attempt,
      maxAttempts: attempt.maxAttempts,
      cutScore: attempt.cutScore,
      scorePoints: attempt.scorePoints ?? undefined,
      totalPoints: attempt.totalPoints ?? undefined
    }))
  }
}

const CombatContext = createContext<CombatContextValue | null>(null)

export function CombatProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CombatState>(initialState)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as CombatState
      if (parsed?.listaAlunos && parsed?.listaCursos) {
        setState(normalizeState({ ...parsed, listaCursos: [] }))
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore storage errors
    }
  }, [state])

  const currentUser = useMemo(
    () => state.listaAlunos.find((student) => student.id === state.currentUserId) || null,
    [state.listaAlunos, state.currentUserId]
  )

  const pushNotification = (
    existing: Notification[],
    payload: Omit<Notification, "id" | "read" | "createdAt"> & {
      createdAt?: string
      id?: number
    }
  ) => {
    const nextId = payload.id ?? Math.max(0, ...existing.map((item) => item.id)) + 1
    return [
      {
        id: nextId,
        kind: payload.kind,
        title: payload.title,
        message: payload.message,
        link: payload.link,
        read: false,
        createdAt: payload.createdAt ?? new Date().toLocaleString("pt-BR"),
        scope: payload.scope,
        severity: payload.severity
      },
      ...existing
    ]
  }

  const cadastrarAluno: CombatContextValue["cadastrarAluno"] = (data) => {
    setState((prev) => {
      const nextId = Math.max(0, ...prev.listaAlunos.map((student) => student.id)) + 1
      const novoAluno: User = {
        id: nextId,
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role ?? "student",
        enrolledAt: data.enrolledAt,
        status: data.status,
        phone: data.phone,
        cpf: data.cpf ?? "",
        courses: data.courses ?? {},
        certificate: undefined,
        progress: {},
        notifications: [],
        documents: data.documents ?? []
      }
      return { ...prev, listaAlunos: [...prev.listaAlunos, novoAluno] }
    })
  }

  const login: CombatContextValue["login"] = ({ email, password }) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setState((prev) => ({ ...prev, currentUserId: null, currentRole: "admin" }))
      return { ok: true, role: "admin" }
    }

    const found = state.listaAlunos.find((student) => student.email === email && student.password === password)
    if (!found) return { ok: false, role: null }

    setState((prev) => ({ ...prev, currentUserId: found.id, currentRole: found.role }))
    return { ok: true, role: found.role }
  }

  const logout = () => {
    setState((prev) => ({ ...prev, currentUserId: null, currentRole: null }))
  }

  const criarCurso: CombatContextValue["criarCurso"] = (payload) => {
    setState((prev) => {
      const nextId = Math.max(0, ...prev.listaCursos.map((course) => course.id)) + 1
      const nextCourse: Course = {
        id: nextId,
        code: payload.code.toUpperCase(),
        name: payload.name,
        description: payload.description,
        thumbnail: payload.thumbnail,
        totalHours: payload.totalHours || "0h",
        status: payload.status ?? "rascunho",
        modules: [],
        finalExam: null
      }
      return { ...prev, listaCursos: [...prev.listaCursos, nextCourse] }
    })
  }

  const liberarCurso: CombatContextValue["liberarCurso"] = (alunoId, cursoId) => {
    setState((prev) => ({
      ...prev,
      listaAlunos: prev.listaAlunos.map((student) => {
        if (student.id !== alunoId) return student
        return {
          ...student,
          courses: { ...student.courses, [cursoId]: !student.courses[cursoId] }
        }
      })
    }))
  }

  const salvarConteudoPolimorfico: CombatContextValue["salvarConteudoPolimorfico"] = (
    cursoId,
    moduleId,
    item
  ) => {
    setState((prev) => ({
      ...prev,
      listaCursos: prev.listaCursos.map((course) => {
        if (course.id !== cursoId) return course
        return {
          ...course,
          modules: course.modules.map((module) => {
            if (module.id !== moduleId) return module
            if (item.type === "activity") {
              return { ...module, exams: [...module.exams, item] }
            }
            return { ...module, lessons: [...module.lessons, item] }
          })
        }
      })
    }))
  }

  const buildCourseLessonIndex = (course: Course) => {
    const map = new Map<number, { moduleId: number; lesson: Lesson }>()
    course.modules.forEach((module) => {
      module.lessons.forEach((lesson) => {
        map.set(lesson.id, { moduleId: module.id, lesson })
      })
    })
    return map
  }

  const buildCourseExamIndex = (course: Course) => {
    const map = new Map<number, { moduleId: number; exam: Exam }>()
    course.modules.forEach((module) => {
      module.exams.forEach((exam) => {
        map.set(exam.id, { moduleId: module.id, exam })
      })
    })
    return map
  }

  const atualizarCurso: CombatContextValue["atualizarCurso"] = (curso) => {
    setState((prev) => {
      const previousCourse = prev.listaCursos.find((item) => item.id === curso.id)
      const nextCourses = prev.listaCursos.map((item) =>
        item.id === curso.id ? curso : item
      )

      if (!previousCourse) {
        return { ...prev, listaCursos: nextCourses }
      }

      const previousLessons = buildCourseLessonIndex(previousCourse)
      const nextLessons = buildCourseLessonIndex(curso)
      const addedLessons: Array<{ moduleId: number; lesson: Lesson }> = []
      nextLessons.forEach((value, key) => {
        if (!previousLessons.has(key)) {
          addedLessons.push(value)
        }
      })

      const previousExams = buildCourseExamIndex(previousCourse)
      const nextExams = buildCourseExamIndex(curso)
      const addedExams: Array<{ moduleId: number; exam: Exam }> = []
      nextExams.forEach((value, key) => {
        if (!previousExams.has(key)) {
          addedExams.push(value)
        }
      })

      const addedFinalExam = !previousCourse.finalExam && curso.finalExam

      if (!addedLessons.length && !addedExams.length && !addedFinalExam) {
        return { ...prev, listaCursos: nextCourses }
      }

      return {
        ...prev,
        listaCursos: nextCourses,
        listaAlunos: prev.listaAlunos.map((student) => {
          if (!student.courses?.[curso.id]) return student
          let nextNotifications = student.notifications ?? []

          addedLessons.forEach(({ moduleId, lesson }) => {
            nextNotifications = pushNotification(nextNotifications, {
              kind: "LESSON_NEW",
              message: `Nova aula liberada: ${lesson.title}`,
              link: `/curso/${curso.id}?moduleId=${moduleId}&lessonId=${lesson.id}`,
              scope: "user",
              severity: "info"
            })
          })

          addedExams.forEach(({ moduleId, exam }) => {
            nextNotifications = pushNotification(nextNotifications, {
              kind: "EXAM_AVAILABLE",
              message: `Nova atividade liberada: ${exam.title}`,
              link: `/curso/${curso.id}/missao?type=activity&moduleId=${moduleId}&examId=${exam.id}`,
              scope: "user",
              severity: "info"
            })
          })

          if (addedFinalExam) {
            nextNotifications = pushNotification(nextNotifications, {
              kind: "EXAM_AVAILABLE",
              message: "Exame final liberado.",
              link: `/curso/${curso.id}/missao?type=final`,
              scope: "user",
              severity: "info"
            })
          }

          return { ...student, notifications: nextNotifications }
        })
      }
    })
  }

  const lancarNota: CombatContextValue["lancarNota"] = (
    alunoId,
    exameId,
    nota,
    feedback,
    scorePoints,
    totalPointsParam
  ) => {
    setState((prev) => {
      const targetAttempt = prev.tentativasExames.find((attempt) => attempt.id === exameId)
      const totalPoints = targetAttempt?.totalPoints ?? totalPointsParam
      const resolvedScorePoints =
        typeof scorePoints === "number"
          ? scorePoints
          : totalPoints
            ? Number(((nota / 100) * totalPoints).toFixed(2))
            : undefined
      const resolvedPercent = totalPoints && typeof resolvedScorePoints === "number"
        ? Math.round((resolvedScorePoints / totalPoints) * 100)
        : nota
      const cutScore = targetAttempt?.cutScore ?? 70
      const result = resolvedPercent >= cutScore ? "apto" : "nao_apto"
      return {
        ...prev,
        tentativasExames: prev.tentativasExames.map((attempt) => {
          if (attempt.id !== exameId) return attempt
          return {
            ...attempt,
            scorePercent: resolvedPercent,
            scorePoints: resolvedScorePoints ?? attempt.scorePoints,
            status: "corrigido",
            result,
            feedback
          }
        }),
        listaAlunos: prev.listaAlunos.map((student) => {
          if (student.id !== alunoId) return student
          const notifications = pushNotification(student.notifications ?? [], {
            kind: "EXAM_GRADED",
            message: `Sua atividade foi corrigida com nota ${resolvedPercent}%.`,
            link: `/dashboard?section=atividades&attemptId=${exameId}`,
            scope: "user",
            severity: "info"
          })
          return {
            ...student,
            status: result === "apto" && student.status !== "certificado" ? "apto" : student.status,
            notifications
          }
        })
      }
    })
  }

  const uploadCertificadoExterno: CombatContextValue["uploadCertificadoExterno"] = (
    alunoId,
    arquivo
  ) => {
    setState((prev) => ({
      ...prev,
      listaAlunos: prev.listaAlunos.map((student) =>
        student.id === alunoId
          ? {
              ...student,
              status: "certificado",
              certificate: arquivo,
              notifications: pushNotification(student.notifications ?? [], {
                kind: "GLOBAL_ALERT",
                title: "Certificado",
                message: "Seu certificado foi liberado para download.",
                link: "/dashboard?section=notas",
                scope: "user",
                severity: "info"
              })
            }
          : student
      )
    }))
  }

  const adicionarArquivoBiblioteca: CombatContextValue["adicionarArquivoBiblioteca"] = (item) => {
    setState((prev) => {
      const nextId = Math.max(0, ...prev.bibliotecaArquivos.map((entry) => entry.id)) + 1
      return {
        ...prev,
        bibliotecaArquivos: [
          ...prev.bibliotecaArquivos,
          {
            ...item,
            id: nextId,
            updatedAt: new Date().toLocaleDateString("pt-BR")
          }
        ]
      }
    })
  }

  const atualizarArquivoBiblioteca: CombatContextValue["atualizarArquivoBiblioteca"] = (itemId, patch) => {
    setState((prev) => ({
      ...prev,
      bibliotecaArquivos: prev.bibliotecaArquivos.map((entry) =>
        entry.id === itemId
          ? {
              ...entry,
              ...patch,
              tags: patch.tags ?? entry.tags,
              updatedAt: new Date().toLocaleDateString("pt-BR")
            }
          : entry
      )
    }))
  }

  const removerArquivoBiblioteca: CombatContextValue["removerArquivoBiblioteca"] = (itemId) => {
    setState((prev) => ({
      ...prev,
      bibliotecaArquivos: prev.bibliotecaArquivos.filter((entry) => entry.id !== itemId)
    }))
  }

  const atualizarAluno: CombatContextValue["atualizarAluno"] = (alunoId, patch) => {
    setState((prev) => ({
      ...prev,
      listaAlunos: prev.listaAlunos.map((student) => {
        if (student.id !== alunoId) return student
        const { id: _ignoredId, ...safePatch } = patch
        return {
          ...student,
          ...safePatch,
          documents: safePatch.documents ?? student.documents,
          courses: safePatch.courses ?? student.courses,
          progress: safePatch.progress ?? student.progress,
          notifications: safePatch.notifications ?? student.notifications
        }
      })
    }))
  }

  const adicionarDocumentoAluno: CombatContextValue["adicionarDocumentoAluno"] = (
    alunoId,
    payload
  ) => {
    setState((prev) => ({
      ...prev,
      listaAlunos: prev.listaAlunos.map((student) => {
        if (student.id !== alunoId) return student
        const existing = student.documents ?? []
        const nextId = Math.max(0, ...existing.map((doc) => doc.id)) + 1
        const nextDoc: UserDocument = {
          id: nextId,
          name: payload.name,
          kind: payload.kind,
          fileUrl: payload.fileUrl,
          status: payload.status ?? "aguardando",
          uploadedAt: new Date().toLocaleDateString("pt-BR")
        }
        return {
          ...student,
          documents: [...existing, nextDoc]
        }
      })
    }))
  }

  const validarDocumentoAluno: CombatContextValue["validarDocumentoAluno"] = (
    alunoId,
    documentId,
    status
  ) => {
    setState((prev) => ({
      ...prev,
      listaAlunos: prev.listaAlunos.map((student) => {
        if (student.id !== alunoId) return student
        const documents = student.documents ?? []
        const nextDocuments = documents.map((doc) =>
          doc.id === documentId ? { ...doc, status } : doc
        )
        return {
          ...student,
          documents: nextDocuments
        }
      })
    }))
  }

  const alterarSenhaAluno: CombatContextValue["alterarSenhaAluno"] = (alunoId, senha) => {
    setState((prev) => ({
      ...prev,
      listaAlunos: prev.listaAlunos.map((student) =>
        student.id === alunoId ? { ...student, password: senha } : student
      )
    }))
  }

  const enviarMissao: CombatContextValue["enviarMissao"] = ({
    alunoId,
    courseId,
    examId,
    moduleId,
    title,
    examType,
    answers,
    scorePercent,
    scorePoints,
    totalPoints,
    hasEssay,
    maxAttempts,
    cutScore
  }) => {
    setState((prev) => {
      const nextId = Math.max(0, ...prev.tentativasExames.map((attempt) => attempt.id)) + 1
      const passed = cutScore ? scorePercent >= cutScore : scorePercent >= 70
      const attemptsUsed = prev.tentativasExames.filter(
        (attempt) =>
          attempt.userId === alunoId &&
          attempt.courseId === courseId &&
          attempt.examType === examType &&
          attempt.examId === examId
      ).length
      if (maxAttempts && attemptsUsed >= maxAttempts) {
        return {
          ...prev,
          listaAlunos: prev.listaAlunos.map((student) =>
            student.id === alunoId
              ? {
                  ...student,
                  notifications: pushNotification(student.notifications ?? [], {
                    kind: "GLOBAL_ALERT",
                    title: "Tentativas esgotadas",
                    message: "Limite de tentativas atingido. Contate o instrutor.",
                    link: "/dashboard?section=atividades",
                    scope: "user",
                    severity: "critical"
                  })
                }
              : student
          )
        }
      }
      const resolvedScorePoints =
        typeof scorePoints === "number"
          ? scorePoints
          : totalPoints
            ? Number(((scorePercent / 100) * totalPoints).toFixed(2))
            : undefined
      const attempt: ExamAttempt = {
        id: nextId,
        userId: alunoId,
        courseId,
        examId,
        moduleId,
        title,
        examType,
        answers,
        scorePercent,
        scorePoints: resolvedScorePoints,
        totalPoints,
        hasEssay,
        status: hasEssay ? "pendente" : "corrigido",
        result: passed ? "apto" : "nao_apto",
        submittedAt: new Date().toLocaleDateString("pt-BR"),
        attemptNumber: attemptsUsed + 1,
        maxAttempts,
        cutScore
      }
      return {
        ...prev,
        tentativasExames: [...prev.tentativasExames, attempt],
        listaAlunos: prev.listaAlunos.map((student) =>
          student.id === alunoId
            ? {
                ...student,
                status: passed && !hasEssay ? "apto" : student.status,
                notifications: pushNotification(student.notifications ?? [], {
                  kind: "GLOBAL_ALERT",
                  title: "Missao enviada",
                  message: hasEssay
                    ? "Sua missao foi enviada. Avaliacao pendente."
                    : passed
                      ? "Missao concluida com sucesso."
                      : "Missao enviada. Resultado abaixo do minimo.",
                  link: `/dashboard?section=atividades&attemptId=${nextId}`,
                  scope: "user",
                  severity: passed ? "info" : "critical"
                })
              }
            : student
        )
      }
    })
  }

  const marcarAulaConcluida: CombatContextValue["marcarAulaConcluida"] = (
    alunoId,
    cursoId,
    lessonId
  ) => {
    setState((prev) => ({
      ...prev,
      listaAlunos: prev.listaAlunos.map((student) => {
        if (student.id !== alunoId) return student
        const current = student.progress?.[cursoId] || []
        if (current.includes(lessonId)) return student
        return {
          ...student,
          progress: {
            ...student.progress,
            [cursoId]: [...current, lessonId]
          }
        }
      })
    }))
  }

  const criarAviso: CombatContextValue["criarAviso"] = ({ title, message, priority }) => {
    setState((prev) => {
      const nextId = Math.max(
        0,
        ...prev.listaAlunos.flatMap((student) =>
          (student.notifications ?? []).map((item) => item.id)
        )
      ) + 1
      return {
        ...prev,
        listaAlunos: prev.listaAlunos.map((student) => ({
          ...student,
          notifications: pushNotification(student.notifications ?? [], {
            id: nextId,
            kind: "GLOBAL_ALERT",
            title,
            message,
            link: "/dashboard",
            scope: "global",
            severity: priority
          })
        }))
      }
    })
  }

  const addNotification: CombatContextValue["addNotification"] = ({
    alunoId,
    kind,
    message,
    link,
    scope,
    severity
  }) => {
    setState((prev) => ({
      ...prev,
      listaAlunos: prev.listaAlunos.map((student) =>
        student.id === alunoId
          ? {
              ...student,
              notifications: pushNotification(student.notifications ?? [], {
                kind,
                message,
                link,
                scope: scope ?? "user",
                severity: severity ?? "info"
              })
            }
          : student
      )
    }))
  }

  const markAsRead: CombatContextValue["markAsRead"] = (
    alunoId,
    notificationId
  ) => {
    setState((prev) => ({
      ...prev,
      listaAlunos: prev.listaAlunos.map((student) => {
        if (student.id !== alunoId) return student
        return {
          ...student,
          notifications: student.notifications.map((item) =>
            item.id === notificationId ? { ...item, read: true } : item
          )
        }
      })
    }))
  }

  const marcarNotificacaoLida: CombatContextValue["marcarNotificacaoLida"] = (
    alunoId,
    notificationId
  ) => {
    markAsRead(alunoId, notificationId)
  }

  const value = useMemo<CombatContextValue>(
    () => ({
      ...state,
      currentUser,
      cadastrarAluno,
      login,
      logout,
      criarCurso,
      liberarCurso,
      salvarConteudoPolimorfico,
      atualizarCurso,
      lancarNota,
      uploadCertificadoExterno,
      adicionarArquivoBiblioteca,
      atualizarArquivoBiblioteca,
      removerArquivoBiblioteca,
      atualizarAluno,
      adicionarDocumentoAluno,
      validarDocumentoAluno,
      alterarSenhaAluno,
      enviarMissao,
      marcarAulaConcluida,
      criarAviso,
      addNotification,
      markAsRead,
      marcarNotificacaoLida
    }),
    [state, currentUser]
  )

  return <CombatContext.Provider value={value}>{children}</CombatContext.Provider>
}

export function useCombatContext() {
  const context = useContext(CombatContext)
  if (!context) {
    throw new Error("useCombatContext must be used within CombatProvider")
  }
  return context
}
