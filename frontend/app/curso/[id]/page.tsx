"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  Play,
  CheckCircle2,
  Circle,
  Lock,
  Download,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  User
} from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCombatContext } from "@/contexts/CombatContext"

export default function CoursePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { listaCursos, bibliotecaArquivos, currentUser, marcarAulaConcluida } = useCombatContext()
  const courseId = Number(params.id)
  const course = listaCursos.find((item) => item.id === courseId) || listaCursos[0]
  const [expandedModule, setExpandedModule] = useState<number | null>(course?.modules?.[0]?.id ?? null)
  const [activeModuleIndex, setActiveModuleIndex] = useState(0)
  const [activeItemIndex, setActiveItemIndex] = useState(0)
  const [newComment, setNewComment] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!course?.modules?.length) return
    const moduleIdParam = Number(searchParams.get("moduleId"))
    const itemIdParam = Number(searchParams.get("itemId"))
    if (!moduleIdParam || !itemIdParam) return
    const moduleIndex = course.modules.findIndex((module) => module.id === moduleIdParam)
    if (moduleIndex < 0) return
    const itemIndex = course.modules[moduleIndex].items.findIndex(
      (item) => item.id === itemIdParam
    )
    if (itemIndex < 0) return
    setExpandedModule(course.modules[moduleIndex].id)
    setActiveModuleIndex(moduleIndex)
    setActiveItemIndex(itemIndex)
    setIsPlaying(false)
  }, [searchParams, course])

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Header userName="Operador Delta" />
        <main className="p-6">
          <p className="text-[#6b7a5f]">Curso nao encontrado.</p>
        </main>
      </div>
    )
  }

  const activeModule = course.modules[activeModuleIndex]
  const activeItem = activeModule?.items[activeItemIndex]

  const handlePlay = () => setIsPlaying(true)

  const handleLessonClick = (mi: number, ii: number) => {
    setActiveModuleIndex(mi)
    setActiveItemIndex(ii)
    setIsPlaying(false)
    const module = course.modules[mi]
    const item = module?.items[ii]
    if (currentUser && item) {
      marcarAulaConcluida(currentUser.id, course.id, item.id)
    }
  }

  const startFinalExam = () => {
    router.push(`/curso/${course.id}/missao?type=final`)
  }

  const startActivity = (moduleId: number, itemId: number) => {
    router.push(`/curso/${course.id}/missao?type=activity&moduleId=${moduleId}&itemId=${itemId}`)
  }

  const attemptsForItem = (itemId: number) => {
    return currentUser?.progress?.[course.id]?.includes(itemId) || false
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userName={currentUser?.name || "Operador Delta"} />

      <div className="flex flex-col lg:flex-row">
        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-1 text-[10px] text-[#6b7a5f] mb-4 sm:gap-2 sm:text-xs">
            <span>{course.code}</span>
            <span>/</span>
            <span>{course.name}</span>
            <span>/</span>
            <span className="text-[#F4511E]">{activeItem?.title}</span>
          </div>

          {/* Player / Content */}
          <div className="relative bg-secondary border border-border mb-6">
            {!isPlaying && activeItem?.type === 'video' ? (
              <div className="aspect-video flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <h2 className="text-lg font-bold text-white mb-2 sm:text-xl">{activeItem.title}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/70 sm:text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {activeItem.duration || course.totalHours}
                    </span>
                  </div>
                </div>
                <button onClick={handlePlay} className="relative z-10 flex h-16 w-16 items-center justify-center border-2 border-[#F4511E] bg-[#F4511E] hover:scale-105 transition-transform sm:h-20 sm:w-20">
                  <Play className="h-8 w-8 text-white fill-white ml-1" />
                </button>
              </div>
            ) : activeItem?.type === 'video' ? (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${activeItem.videoId || ''}?autoplay=1&rel=0`}
                  title={activeItem.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="p-6">
                {activeItem?.type === 'material' && (
                  <div>
                    <h3 className="font-medium mb-2">Materiais (Biblioteca Global)</h3>
                    <ul className="space-y-2">
                      {bibliotecaArquivos.map((lib) => (
                        <li key={lib.id}>
                          <a href={lib.url} target="_blank" rel="noreferrer" className="text-primary">{lib.title}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeItem?.type === 'activity' && (
                  <div>
                    <p className="mb-2">Atividade: {activeItem.title}</p>
                    <p className="mb-2">Tentativas permitidas: {activeItem.attemptLimit}</p>
                    <Button onClick={() => startActivity(activeModule.id, activeItem.id)}>Iniciar Atividade</Button>
                    {attemptsForItem(activeItem.id) && (
                      <p className="text-xs text-[#6b7a5f] mt-2">Atividade registrada como concluida.</p>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Download & Debate */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Button variant="outline" className="border-[#6b7a5f] text-[#6b7a5f] hover:bg-[#6b7a5f] hover:text-white rounded-none w-full justify-start whitespace-normal text-left sm:w-auto sm:justify-center sm:text-center">
              <FileText className="h-4 w-4 mr-2" />
              Download de Manual Tático
              <Download className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" className="border-border text-[#6b7a5f] hover:bg-secondary rounded-none w-full justify-start whitespace-normal text-left sm:w-auto sm:justify-center sm:text-center">
              <FileText className="h-4 w-4 mr-2" />
              Material Complementar PDF
              <Download className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="border border-border bg-card">
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <MessageSquare className="h-5 w-5 text-[#F4511E]" />
              <h3 className="font-bold text-foreground uppercase tracking-wider">Debate Técnico</h3>
            </div>
            <div className="p-4 border-b border-border">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-10 w-10 items-center justify-center bg-[#6b7a5f]/20 border border-[#6b7a5f] shrink-0">
                  <User className="h-5 w-5 text-[#6b7a5f]" />
                </div>
                <div className="flex-1 flex flex-col gap-2 sm:flex-row">
                  <Input placeholder="Compartilhe sua análise técnica..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1 border-border bg-secondary rounded-none text-sm" />
                  <Button className="bg-[#F4511E] hover:bg-[#F4511E]/90 rounded-none px-4 w-full sm:w-auto"><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar - Modules */}
        <aside className="w-full lg:w-96 border-t border-border bg-card lg:border-t-0 lg:border-l">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold text-foreground uppercase tracking-wider">Módulos do Curso</h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1 bg-secondary"><div className="h-full w-[45%] bg-[#F4511E]" /></div>
              <span className="text-xs text-[#6b7a5f]">45%</span>
            </div>
          </div>

          <div className="divide-y divide-border">
            {course.modules.map((module, mi) => (
              <div key={module.id}>
                <button onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)} className="flex items-center justify-between w-full p-3 text-left hover:bg-secondary/50 transition-colors sm:p-4">
                  <div>
                    <p className="font-medium text-foreground text-sm">{module.name}</p>
                    <p className="text-xs text-[#6b7a5f] mt-1">{module.items.length} itens</p>
                  </div>
                  {expandedModule === module.id ? <ChevronUp className="h-5 w-5 text-[#6b7a5f]" /> : <ChevronDown className="h-5 w-5 text-[#6b7a5f]" />}
                </button>

                {expandedModule === module.id && (
                  <div className="bg-secondary/30">
                    {module.items.map((item, ii) => (
                      <button key={item.id} onClick={() => handleLessonClick(mi, ii)} className={`flex items-center gap-3 w-full p-3 text-left border-l-2 transition-colors sm:p-4 ${ii === activeItemIndex && mi === activeModuleIndex ? 'border-[#F4511E] bg-[#F4511E]/10' : 'border-transparent hover:bg-secondary/50'}`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${ii === activeItemIndex && mi === activeModuleIndex ? 'text-[#F4511E] font-medium' : 'text-foreground'}`}>{item.title}</p>
                          <p className="text-xs text-[#6b7a5f] mt-0.5">{item.duration || ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="p-4">
              <Button variant="default" onClick={startFinalExam}>Iniciar Exame Final</Button>
              <p className="text-sm text-muted-foreground mt-2">Tentativas permitidas: {course.finalExam?.attemptLimit ?? 0}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
