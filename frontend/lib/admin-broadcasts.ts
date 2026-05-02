export type BroadcastPriority = 'baixa' | 'media' | 'alta'

export interface BroadcastNotice {
  id: number
  title: string
  message: string
  priority: BroadcastPriority
  author: string
  createdAt: string
}

export const initialBroadcasts: BroadcastNotice[] = [
  {
    id: 1,
    title: 'Treino de simulacao agendado',
    message: 'Exercicio pratico no dia 10/05 as 08:00. Comparecer com uniforme completo.',
    priority: 'alta',
    author: 'Comando Central',
    createdAt: '01/05/2026'
  },
  {
    id: 2,
    title: 'Atualizacao de material CQC',
    message: 'Novo manual tatico disponivel na biblioteca global. Revisao obrigatoria.',
    priority: 'media',
    author: 'Instrutor chefe',
    createdAt: '30/04/2026'
  }
]
