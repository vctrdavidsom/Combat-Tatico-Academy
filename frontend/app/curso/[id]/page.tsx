"use client"

import { useState } from "react"
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

const modules = [
  {
    id: 1,
    title: "Módulo 1: Fundamentos",
    lessons: [
      { id: 1, title: "Introdução ao Combate Tático", duration: "12:45", completed: true },
      { id: 2, title: "Postura e Movimentação", duration: "18:30", completed: true },
      { id: 3, title: "Análise de Ambiente", duration: "15:20", completed: false }
    ]
  },
  {
    id: 2,
    title: "Módulo 2: Técnicas de Combate",
    lessons: [
      { id: 4, title: "Luta Completa - Tactical Combat", duration: "45:12", completed: false, videoId: "jyTUFvYLgUk", current: true },
      { id: 5, title: "Defesa Pessoal Básica", duration: "22:10", completed: false },
      { id: 6, title: "Imobilização Tática", duration: "19:45", completed: false }
    ]
  },
  {
    id: 3,
    title: "Módulo 3: Situações Reais",
    lessons: [
      { id: 7, title: "Análise de Casos", duration: "28:00", completed: false, locked: true },
      { id: 8, title: "Simulação de Cenários", duration: "35:15", completed: false, locked: true }
    ]
  }
]

const comments = [
  {
    id: 1,
    author: "Cap. Rodrigues",
    badge: "Instrutor",
    content: "Observem a transição no minuto 2:34 - técnica perfeita de controle de distância. Este é o padrão que vocês devem seguir nos exercícios práticos.",
    time: "2h atrás",
    likes: 12
  },
  {
    id: 2,
    author: "Aluno Silva",
    badge: "Turma Alpha",
    content: "A movimentação lateral nesse combate é exemplar. Alguém mais percebeu como ele mantém o centro de gravidade baixo durante toda a sequência?",
    time: "5h atrás",
    likes: 8
  },
  {
    id: 3,
    author: "Sgt. Ferreira",
    badge: "Veterano",
    content: "Ponto importante no minuto 5:20 - a leitura do oponente antes da finalização. Isso só vem com treino e experiência em combate real.",
    time: "1d atrás",
    likes: 15
  }
]

export default function CoursePage() {
  const [expandedModule, setExpandedModule] = useState<number | null>(2)
  const [currentLesson, setCurrentLesson] = useState(modules[1].lessons[0])
  const [newComment, setNewComment] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handleLessonClick = (lesson: typeof modules[0]["lessons"][0]) => {
    if (!lesson.locked) {
      setCurrentLesson(lesson)
      setIsPlaying(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userName="Operador Delta" />

      <div className="flex flex-col lg:flex-row">
        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-1 text-[10px] text-[#6b7a5f] mb-4 sm:gap-2 sm:text-xs">
            <span>CQC-001</span>
            <span>/</span>
            <span>Táticas de Combate Próximo</span>
            <span>/</span>
            <span className="text-[#F4511E]">{currentLesson.title}</span>
          </div>

          {/* Video Player */}
          <div className="relative bg-secondary border border-border mb-6">
            {!isPlaying ? (
              <div className="aspect-video flex items-center justify-center relative">
                {/* Thumbnail Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Video Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                  <h2 className="text-lg font-bold text-white mb-2 sm:text-xl">
                    {currentLesson.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/70 sm:text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {currentLesson.duration}
                    </span>
                    <span>Módulo 2 - Aula 1</span>
                  </div>
                </div>

                {/* Play Button */}
                <button
                  onClick={handlePlay}
                  className="relative z-10 flex h-16 w-16 items-center justify-center border-2 border-[#F4511E] bg-[#F4511E] hover:scale-105 transition-transform sm:h-20 sm:w-20"
                >
                  <Play className="h-8 w-8 text-white fill-white ml-1" />
                </button>

                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="w-full h-full" style={{
                    backgroundImage: `repeating-linear-gradient(
                      0deg,
                      transparent,
                      transparent 40px,
                      #F4511E 40px,
                      #F4511E 41px
                    ),
                    repeating-linear-gradient(
                      90deg,
                      transparent,
                      transparent 40px,
                      #F4511E 40px,
                      #F4511E 41px
                    )`
                  }} />
                </div>
              </div>
            ) : (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${currentLesson.videoId || 'jyTUFvYLgUk'}?autoplay=1&rel=0`}
                  title={currentLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            )}
          </div>

          {/* Download Section */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Button 
              variant="outline" 
              className="border-[#6b7a5f] text-[#6b7a5f] hover:bg-[#6b7a5f] hover:text-white rounded-none w-full justify-start whitespace-normal text-left sm:w-auto sm:justify-center sm:text-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download de Manual Tático
              <Download className="h-4 w-4 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              className="border-border text-[#6b7a5f] hover:bg-secondary rounded-none w-full justify-start whitespace-normal text-left sm:w-auto sm:justify-center sm:text-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Material Complementar PDF
              <Download className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Debate Section */}
          <div className="border border-border bg-card">
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <MessageSquare className="h-5 w-5 text-[#F4511E]" />
              <h3 className="font-bold text-foreground uppercase tracking-wider">
                Debate Técnico
              </h3>
              <span className="text-xs text-[#6b7a5f] ml-auto">
                {comments.length} comentários
              </span>
            </div>

            {/* Comment Form */}
            <div className="p-4 border-b border-border">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-10 w-10 items-center justify-center bg-[#6b7a5f]/20 border border-[#6b7a5f] shrink-0">
                  <User className="h-5 w-5 text-[#6b7a5f]" />
                </div>
                <div className="flex-1 flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Compartilhe sua análise técnica..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 border-border bg-secondary rounded-none text-sm"
                  />
                  <Button 
                    className="bg-[#F4511E] hover:bg-[#F4511E]/90 rounded-none px-4 w-full sm:w-auto"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="divide-y divide-border">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center bg-[#6b7a5f]/20 border border-[#6b7a5f] shrink-0">
                      <User className="h-5 w-5 text-[#6b7a5f]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-medium text-foreground text-sm">
                          {comment.author}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-[#F4511E]/10 text-[#F4511E] uppercase tracking-wider">
                          {comment.badge}
                        </span>
                        <span className="text-xs text-[#6b7a5f] w-full sm:w-auto sm:ml-auto">
                          {comment.time}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <button className="text-xs text-[#6b7a5f] hover:text-[#F4511E] flex items-center gap-1">
                          <span>▲</span> {comment.likes}
                        </button>
                        <button className="text-xs text-[#6b7a5f] hover:text-foreground">
                          Responder
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Sidebar - Modules */}
        <aside className="w-full lg:w-96 border-t border-border bg-card lg:border-t-0 lg:border-l">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold text-foreground uppercase tracking-wider">
              Módulos do Curso
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1 bg-secondary">
                <div className="h-full w-[45%] bg-[#F4511E]" />
              </div>
              <span className="text-xs text-[#6b7a5f]">45%</span>
            </div>
          </div>

          <div className="divide-y divide-border">
            {modules.map((module) => (
              <div key={module.id}>
                <button
                  onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                  className="flex items-center justify-between w-full p-3 text-left hover:bg-secondary/50 transition-colors sm:p-4"
                >
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {module.title}
                    </p>
                    <p className="text-xs text-[#6b7a5f] mt-1">
                      {module.lessons.filter(l => l.completed).length}/{module.lessons.length} aulas
                    </p>
                  </div>
                  {expandedModule === module.id ? (
                    <ChevronUp className="h-5 w-5 text-[#6b7a5f]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[#6b7a5f]" />
                  )}
                </button>

                {expandedModule === module.id && (
                  <div className="bg-secondary/30">
                    {module.lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonClick(lesson)}
                        disabled={lesson.locked}
                        className={`flex items-center gap-3 w-full p-3 text-left border-l-2 transition-colors sm:p-4 ${
                          lesson.current 
                            ? "border-[#F4511E] bg-[#F4511E]/10" 
                            : lesson.locked
                            ? "border-transparent opacity-50 cursor-not-allowed"
                            : "border-transparent hover:bg-secondary/50"
                        }`}
                      >
                        {lesson.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        ) : lesson.locked ? (
                          <Lock className="h-5 w-5 text-[#6b7a5f] shrink-0" />
                        ) : lesson.current ? (
                          <Play className="h-5 w-5 text-[#F4511E] shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-[#6b7a5f] shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${
                            lesson.current ? "text-[#F4511E] font-medium" : "text-foreground"
                          }`}>
                            {lesson.title}
                          </p>
                          <p className="text-xs text-[#6b7a5f] mt-0.5">
                            {lesson.duration}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
