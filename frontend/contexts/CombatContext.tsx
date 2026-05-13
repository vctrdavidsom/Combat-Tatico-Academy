"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { courseMock } from "@/lib/course-data"
import { initialLibraryItems, type LibraryItem } from "@/lib/admin-library"
import { initialBroadcasts, type BroadcastNotice } from "@/lib/admin-broadcasts"

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

export type ContentType = "video" | "material" | "activity"

export type ContentItem = {
  id: number
  type: ContentType
  title: string
  videoId?: string
  duration?: string
  materialPdfUrl?: string
  materialLinkUrl?: string
  materials?: MaterialAttachment[]
  drawCount?: number
  attemptLimit?: number
  questions?: Question[]
  totalPoints?: number
}

export type CourseModule = {
  id: number
  name: string
  description: string
  isExpanded?: boolean
  items: ContentItem[]
}

export type FinalExam = {
  id: number
  title: string
  cutScore: number
  durationMinutes: number
  drawCount: number
  attemptLimit: number
  questions: Question[]
  totalPoints?: number
}

export type CertificateConfig = {
  title: string
  subtitle: string
  issuer: string
  sealUrl: string
  backgroundUrl: string
  signers: { id: number; name: string; role: string }[]
  notes?: string
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
  finalExam: FinalExam | null
  certificateConfig: CertificateConfig
}

export type AuditEntry = {
  id: number
  action: string
  date: string
  details?: string
}

export type CertificateFile = {
  name: string
  dataUrl: string
  uploadedAt: string
}

export type NotificationType =
  | "AULA_NOVA"
  | "ATIVIDADE_CORRIGIDA"
  | "NOVA_ATIVIDADE"
  | "BROADCAST_GERAL"

export type NotificationItem = {
  id: number
  tipo: NotificationType
  mensagem: string
  rota: string
  lida: boolean
  timestamp: string
}

export type StudentDocumentStatus = "aguardando" | "validado" | "recusado"

export type StudentDocument = {
  id: number
  name: string
  kind: "pdf" | "image"
  dataUrl: string
  status: StudentDocumentStatus
  uploadedAt: string
}

export type Student = {
  id: number
  name: string
  email: string
  password: string
  enrolled: string
  status: string
  phone: string
  cpf?: string
  matricula?: string
  courses: Record<number, boolean>
  auditLog: AuditEntry[]
  certificate?: CertificateFile
  progress?: Record<number, number[]>
  notifications: NotificationItem[]
  acknowledgedBroadcasts?: number[]
  documents?: StudentDocument[]
}

export type ExamAttempt = {
  id: number
  alunoId: number
  courseId: number
  contentId?: number
  moduleId?: number
  title: string
  type: "exame" | "atividade"
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
  listaAlunos: Student[]
  listaCursos: Course[]
  bibliotecaArquivos: LibraryItem[]
  tentativasExames: ExamAttempt[]
  quadroAvisos: BroadcastNotice[]
  currentUserId: number | null
  currentRole: "admin" | "aluno" | null
}

type CombatContextValue = CombatState & {
  currentUser: Student | null
  cadastrarAluno: (data: Omit<Student, "id" | "auditLog" | "courses" | "documents" | "notifications" | "acknowledgedBroadcasts"> & { courses?: Record<number, boolean>; documents?: StudentDocument[] }) => void
  login: (credenciais: { email: string; password: string }) => { ok: boolean; role: "admin" | "aluno" | null }
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
  salvarConteudoPolimorfico: (cursoId: number, moduleId: number, item: ContentItem) => void
  atualizarCurso: (curso: Course) => void
  lancarNota: (
    alunoId: number,
    exameId: number,
    nota: number,
    feedback?: string,
    scorePoints?: number,
    totalPoints?: number
  ) => void
  uploadCertificadoExterno: (alunoId: number, arquivo: CertificateFile) => void
  adicionarArquivoBiblioteca: (item: Omit<LibraryItem, "id" | "updatedAt">) => void
  atualizarArquivoBiblioteca: (itemId: number, patch: Partial<LibraryItem>) => void
  removerArquivoBiblioteca: (itemId: number) => void
  atualizarAluno: (alunoId: number, patch: Partial<Student>) => void
  adicionarDocumentoAluno: (alunoId: number, payload: Omit<StudentDocument, "id" | "status" | "uploadedAt"> & { status?: StudentDocumentStatus }) => void
  validarDocumentoAluno: (alunoId: number, documentId: number, status: StudentDocumentStatus) => void
  alterarSenhaAluno: (alunoId: number, senha: string) => void
  enviarMissao: (payload: {
    alunoId: number
    courseId: number
    contentId?: number
    moduleId?: number
    title: string
    type: "exame" | "atividade"
    answers: Record<number, string | number>
    scorePercent: number
    scorePoints?: number
    totalPoints?: number
    hasEssay: boolean
    maxAttempts?: number
    cutScore?: number
  }) => void
  marcarAulaConcluida: (alunoId: number, cursoId: number, itemId: number) => void
  criarAviso: (payload: { title: string; message: string; priority: BroadcastNotice["priority"] }) => void
  addNotification: (payload: {
    alunoId: number
    tipo: NotificationType
    mensagem: string
    rota: string
  }) => void
  markAsRead: (alunoId: number, notificationId: number) => void
  marcarNotificacaoLida: (alunoId: number, notificationId: number) => void
  marcarAvisoCiente: (alunoId: number, noticeId: number) => void
}

const STORAGE_KEY = "cta_state_v1"
const ADMIN_EMAIL = "admin@combat.com"
const ADMIN_PASSWORD = "admin123"

const buildInitialCourses = (): Course[] => {
  const base = courseMock as Course
  const course2: Course = {
    id: 2,
    code: "SSP-002",
    name: "Supervisor em Seguranca Privada",
    description: "<p>Formacao completa para supervisao de equipes de seguranca.</p>",
    thumbnail: "",
    totalHours: "60h",
    status: "ativo",
    modules: [],
    finalExam: null,
    certificateConfig: base.certificateConfig
  }
  const course3: Course = {
    id: 3,
    code: "ARM-003",
    name: "Instrucao de Armeiro",
    description: "<p>Curso tecnico para manutencao e manuseio seguro de armamentos.</p>",
    thumbnail: "",
    totalHours: "40h",
    status: "ativo",
    modules: [],
    finalExam: null,
    certificateConfig: base.certificateConfig
  }
  return [base, course2, course3]
}

const buildInitialStudents = (): Student[] => {
  const today = "04/05/2026"
  return [
    {
      id: 1,
      name: "Joao Silva",
      email: "joao.silva@email.com",
      password: "aluno123",
      enrolled: "15/01/2024",
      status: "ativo",
      phone: "(11) 99999-1234",
      cpf: "123.456.789-00",
      matricula: "MAT-0001",
      courses: { 1: true, 2: true, 3: false },
      auditLog: [{ id: 1, action: "Liberado por Admin", date: today, details: "CQC-001" }],
      progress: { 1: [] },
      notifications: [],
      acknowledgedBroadcasts: [],
      documents: []
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria.santos@email.com",
      password: "aluno123",
      enrolled: "22/02/2024",
      status: "ativo",
      phone: "(11) 99999-5678",
      cpf: "987.654.321-00",
      matricula: "MAT-0002",
      courses: { 1: true, 2: false, 3: false },
      auditLog: [],
      progress: { 1: [] },
      notifications: [],
      acknowledgedBroadcasts: [],
      documents: []
    }
  ]
}

const initialState: CombatState = {
  listaAlunos: buildInitialStudents(),
  listaCursos: buildInitialCourses(),
  bibliotecaArquivos: initialLibraryItems,
  tentativasExames: [],
  quadroAvisos: initialBroadcasts,
  currentUserId: null,
  currentRole: null
}

const normalizeBroadcastPriority = (
  priority: BroadcastNotice["priority"] | string
): BroadcastNotice["priority"] =>
  priority === "critico" || priority === "informativo" ? priority : "informativo"

const normalizeNotifications = (notifications: NotificationItem[] | undefined) => {
  if (!notifications) return []
  return notifications.map((item) => {
    const legacy = item as unknown as {
      id?: number
      kind?: string
      title?: string
      message?: string
      createdAt?: string
      read?: boolean
      tipo?: NotificationType
      mensagem?: string
      rota?: string
      lida?: boolean
      timestamp?: string
    }
    const tipo =
      legacy.tipo ||
      (legacy.kind === "correcao"
        ? "ATIVIDADE_CORRIGIDA"
        : "BROADCAST_GERAL")
    return {
      id: legacy.id ?? 0,
      tipo,
      mensagem: legacy.mensagem ?? legacy.message ?? legacy.title ?? "Atualizacao disponivel",
      rota: legacy.rota ?? "/dashboard",
      lida: legacy.lida ?? legacy.read ?? false,
      timestamp: legacy.timestamp ?? legacy.createdAt ?? new Date().toLocaleString("pt-BR")
    }
  })
}

const normalizeState = (state: CombatState): CombatState => ({
  ...state,
  listaAlunos: state.listaAlunos.map((student) => ({
    ...student,
    auditLog: student.auditLog ?? [],
    courses: student.courses ?? {},
    progress: student.progress ?? {},
    notifications: normalizeNotifications(student.notifications),
    acknowledgedBroadcasts: student.acknowledgedBroadcasts ?? [],
    cpf: student.cpf ?? "",
    matricula: student.matricula ?? "",
    documents: student.documents ?? []
  })),
  tentativasExames: state.tentativasExames.map((attempt) => ({
    ...attempt,
    maxAttempts: attempt.maxAttempts,
    cutScore: attempt.cutScore,
    scorePoints: attempt.scorePoints ?? undefined,
    totalPoints: attempt.totalPoints ?? undefined
  })),
  quadroAvisos: state.quadroAvisos.map((notice) => ({
    ...notice,
    priority: normalizeBroadcastPriority(notice.priority)
  }))
})

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
        setState(normalizeState(parsed))
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
    existing: NotificationItem[],
    payload: Omit<NotificationItem, "id" | "lida" | "timestamp"> & { timestamp?: string }
  ) => {
    const nextId = Math.max(0, ...existing.map((item) => item.id)) + 1
    return [
      {
        id: nextId,
        tipo: payload.tipo,
        mensagem: payload.mensagem,
        rota: payload.rota,
        lida: false,
        timestamp: payload.timestamp ?? new Date().toLocaleString("pt-BR")
      },
      ...existing
    ]
  }

  const cadastrarAluno: CombatContextValue["cadastrarAluno"] = (data) => {
    setState((prev) => {
      const nextId = Math.max(0, ...prev.listaAlunos.map((student) => student.id)) + 1
      const matricula = data.matricula || `MAT-${String(nextId).padStart(4, "0")}`
      const novoAluno: Student = {
        id: nextId,
        name: data.name,
        email: data.email,
        password: data.password,
        enrolled: data.enrolled,
        status: data.status,
        phone: data.phone,
        cpf: data.cpf ?? "",
        matricula,
        courses: data.courses ?? {},
        auditLog: [],
        certificate: undefined,
        progress: {},
        notifications: [],
        acknowledgedBroadcasts: [],
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

    setState((prev) => ({ ...prev, currentUserId: found.id, currentRole: "aluno" }))
    return { ok: true, role: "aluno" }
  }

  const logout = () => {
    setState((prev) => ({ ...prev, currentUserId: null, currentRole: null }))
  }

  const criarCurso: CombatContextValue["criarCurso"] = (payload) => {
    setState((prev) => {
      const nextId = Math.max(0, ...prev.listaCursos.map((course) => course.id)) + 1
      const template =
        prev.listaCursos[0]?.certificateConfig || (courseMock as Course).certificateConfig
      const nextCourse: Course = {
        id: nextId,
        code: payload.code.toUpperCase(),
        name: payload.name,
        description: payload.description,
        thumbnail: payload.thumbnail,
        totalHours: payload.totalHours || "0h",
        status: payload.status ?? "rascunho",
        modules: [],
        finalExam: null,
        certificateConfig: {
          ...template,
          signers: template.signers.map((signer) => ({ ...signer }))
        }
      }
      return { ...prev, listaCursos: [...prev.listaCursos, nextCourse] }
    })
  }

  const liberarCurso: CombatContextValue["liberarCurso"] = (alunoId, cursoId) => {
    const date = new Date().toLocaleDateString("pt-BR")
    setState((prev) => ({
      ...prev,
      listaAlunos: prev.listaAlunos.map((student) => {
        if (student.id !== alunoId) return student
        const auditId = Math.max(0, ...student.auditLog.map((entry) => entry.id)) + 1
        return {
          ...student,
          courses: { ...student.courses, [cursoId]: !student.courses[cursoId] },
          auditLog: [
            ...student.auditLog,
            {
              id: auditId,
              action: student.courses[cursoId] ? "Bloqueado por Admin" : "Liberado por Admin",
              date,
              details: String(cursoId)
            }
          ]
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
            return { ...module, items: [...module.items, item] }
          })
        }
      })
    }))
  }

  const buildCourseItemIndex = (course: Course) => {
    const map = new Map<number, { moduleId: number; item: ContentItem }>()
    course.modules.forEach((module) => {
      module.items.forEach((item) => {
        map.set(item.id, { moduleId: module.id, item })
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

      const previousItems = buildCourseItemIndex(previousCourse)
      const nextItems = buildCourseItemIndex(curso)
      const addedItems: Array<{ moduleId: number; item: ContentItem }> = []
      nextItems.forEach((value, key) => {
        if (!previousItems.has(key)) {
          addedItems.push(value)
        }
      })

      const addedFinalExam = !previousCourse.finalExam && curso.finalExam

      if (!addedItems.length && !addedFinalExam) {
        return { ...prev, listaCursos: nextCourses }
      }

      return {
        ...prev,
        listaCursos: nextCourses,
        listaAlunos: prev.listaAlunos.map((student) => {
          if (!student.courses?.[curso.id]) return student
          let nextNotifications = student.notifications ?? []

          addedItems.forEach(({ moduleId, item }) => {
            const tipo = item.type === "activity" ? "NOVA_ATIVIDADE" : "AULA_NOVA"
            const mensagem =
              item.type === "activity"
                ? `Nova atividade liberada: ${item.title}`
                : `Novo conteudo liberado: ${item.title}`
            const rota = `/curso/${curso.id}?moduleId=${moduleId}&itemId=${item.id}`
            nextNotifications = pushNotification(nextNotifications, { tipo, mensagem, rota })
          })

          if (addedFinalExam) {
            nextNotifications = pushNotification(nextNotifications, {
              tipo: "NOVA_ATIVIDADE",
              mensagem: "Missao de certificacao disponivel. Exame final liberado.",
              rota: `/curso/${curso.id}/missao?type=final`
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
            tipo: "ATIVIDADE_CORRIGIDA",
            mensagem: `Sua atividade foi corrigida com nota ${resolvedPercent}%.`,
            rota: `/dashboard?section=atividades&attemptId=${exameId}`
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
                tipo: "BROADCAST_GERAL",
                mensagem: "Seu certificado foi liberado para download.",
                rota: "/dashboard?section=notas"
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
          notifications: safePatch.notifications ?? student.notifications,
          acknowledgedBroadcasts:
            safePatch.acknowledgedBroadcasts ?? student.acknowledgedBroadcasts
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
        const nextDoc: StudentDocument = {
          id: nextId,
          name: payload.name,
          kind: payload.kind,
          dataUrl: payload.dataUrl,
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
    const date = new Date().toLocaleDateString("pt-BR")
    setState((prev) => ({
      ...prev,
      listaAlunos: prev.listaAlunos.map((student) => {
        if (student.id !== alunoId) return student
        const documents = student.documents ?? []
        const target = documents.find((doc) => doc.id === documentId)
        const nextDocuments = documents.map((doc) =>
          doc.id === documentId ? { ...doc, status } : doc
        )
        const nextAuditId = Math.max(0, ...student.auditLog.map((entry) => entry.id)) + 1
        const statusLabel = status === "validado" ? "validado" : "recusado"
        const action = target
          ? `Documento ${target.name} ${statusLabel} por Admin`
          : `Documento ${documentId} ${statusLabel} por Admin`
        return {
          ...student,
          documents: nextDocuments,
          auditLog: [...student.auditLog, { id: nextAuditId, action, date }]
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
    contentId,
    moduleId,
    title,
    type,
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
          attempt.alunoId === alunoId &&
          attempt.courseId === courseId &&
          attempt.type === type &&
          attempt.contentId === contentId
      ).length
      if (maxAttempts && attemptsUsed >= maxAttempts) {
        return {
          ...prev,
          listaAlunos: prev.listaAlunos.map((student) =>
            student.id === alunoId
              ? {
                  ...student,
                  notifications: pushNotification(student.notifications ?? [], {
                    tipo: "BROADCAST_GERAL",
                    mensagem: "Limite de tentativas atingido. Contate o instrutor.",
                    rota: "/dashboard?section=atividades"
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
        alunoId,
        courseId,
        contentId,
        moduleId,
        title,
        type,
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
                  tipo: "BROADCAST_GERAL",
                  mensagem: hasEssay
                    ? "Sua missao foi enviada. Avaliacao pendente."
                    : passed
                      ? "Missao concluida com sucesso."
                      : "Missao enviada. Resultado abaixo do minimo.",
                  rota: `/dashboard?section=atividades&attemptId=${nextId}`
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
    itemId
  ) => {
    setState((prev) => ({
      ...prev,
      listaAlunos: prev.listaAlunos.map((student) => {
        if (student.id !== alunoId) return student
        const current = student.progress?.[cursoId] || []
        if (current.includes(itemId)) return student
        return {
          ...student,
          progress: {
            ...student.progress,
            [cursoId]: [...current, itemId]
          }
        }
      })
    }))
  }

  const criarAviso: CombatContextValue["criarAviso"] = ({ title, message, priority }) => {
    setState((prev) => {
      const nextId = Math.max(0, ...prev.quadroAvisos.map((notice) => notice.id)) + 1
      return {
        ...prev,
        quadroAvisos: [
          {
            id: nextId,
            title,
            message,
            priority,
            author: "Comando Central",
            createdAt: new Date().toLocaleDateString("pt-BR")
          },
          ...prev.quadroAvisos
        ],
        listaAlunos: prev.listaAlunos.map((student) => ({
          ...student,
          notifications: pushNotification(student.notifications ?? [], {
            tipo: "BROADCAST_GERAL",
            mensagem: message,
            rota: "/dashboard"
          })
        }))
      }
    })
  }

  const addNotification: CombatContextValue["addNotification"] = ({
    alunoId,
    tipo,
    mensagem,
    rota
  }) => {
    setState((prev) => ({
      ...prev,
      listaAlunos: prev.listaAlunos.map((student) =>
        student.id === alunoId
          ? {
              ...student,
              notifications: pushNotification(student.notifications ?? [], {
                tipo,
                mensagem,
                rota
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
            item.id === notificationId ? { ...item, lida: true } : item
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

  const marcarAvisoCiente: CombatContextValue["marcarAvisoCiente"] = (
    alunoId,
    noticeId
  ) => {
    setState((prev) => ({
      ...prev,
      listaAlunos: prev.listaAlunos.map((student) => {
        if (student.id !== alunoId) return student
        const acknowledged = student.acknowledgedBroadcasts ?? []
        if (acknowledged.includes(noticeId)) return student
        return {
          ...student,
          acknowledgedBroadcasts: [...acknowledged, noticeId]
        }
      })
    }))
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
      marcarNotificacaoLida,
      marcarAvisoCiente
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
