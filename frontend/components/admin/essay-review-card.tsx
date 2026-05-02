import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface EssayReviewCardProps {
  studentName: string
  courseName: string
  question: string
  answer: string
  score: number
  feedback: string
  onScoreChange: (value: number) => void
  onFeedbackChange: (value: string) => void
  onResolve: () => void
}

export function EssayReviewCard({
  studentName,
  courseName,
  question,
  answer,
  score,
  feedback,
  onScoreChange,
  onFeedbackChange,
  onResolve
}: EssayReviewCardProps) {
  return (
    <div className="border border-border bg-card">
      <div className="p-4 border-b border-border flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">{courseName}</p>
          <p className="text-sm text-foreground">{studentName}</p>
        </div>
        <div className="text-xs text-[#F4511E] uppercase tracking-wider">Dissertativa pendente</div>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <p className="text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">Enunciado</p>
          <p className="text-sm text-foreground">{question}</p>
        </div>
        <div>
          <p className="text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">Resposta do aluno</p>
          <div className="border border-border bg-secondary/30 p-3 text-sm text-foreground">
            {answer}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
              Nota (0-100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => onScoreChange(Number(e.target.value))}
              className="w-full border border-border bg-secondary rounded-none px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="block text-xs text-[#6b7a5f] uppercase tracking-wider mb-2">
              Feedback tatico
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
              className="border-border bg-secondary rounded-none min-h-[80px] resize-none"
            />
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-border">
        <Button
          onClick={onResolve}
          className="bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none w-full"
        >
          Registrar correcao
        </Button>
      </div>
    </div>
  )
}
