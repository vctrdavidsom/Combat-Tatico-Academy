export type LibraryItemType = 'pdf' | 'link'

export interface LibraryItem {
  id: number
  title: string
  type: LibraryItemType
  url: string
  tags: string[]
  updatedAt: string
}

export const initialLibraryItems: LibraryItem[] = [
  {
    id: 1,
    title: 'Manual de Fundamentos CQC',
    type: 'pdf',
    url: 'https://example.com/manual-cqc.pdf',
    tags: ['cqc', 'fundamentos'],
    updatedAt: '01/05/2026'
  },
  {
    id: 2,
    title: 'Guia de Procedimentos de Sala Segura',
    type: 'pdf',
    url: 'https://example.com/sala-segura.pdf',
    tags: ['procedimentos'],
    updatedAt: '28/04/2026'
  },
  {
    id: 3,
    title: 'Checklist de Briefing Operacional',
    type: 'link',
    url: 'https://example.com/briefing',
    tags: ['briefing', 'operacional'],
    updatedAt: '25/04/2026'
  }
]
