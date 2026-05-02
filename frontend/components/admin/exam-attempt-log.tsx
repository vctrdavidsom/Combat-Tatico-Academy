interface ExamQuestionResult {
  id: number
  prompt: string
  correct: boolean
}

interface ExamAttemptLogProps {
  studentName: string
  courseName: string
  examName: string
  score: number
  cutScore: number
  submittedAt: string
  durationMinutes: number
  results: ExamQuestionResult[]
}

export function ExamAttemptLog({
  studentName,
  courseName,
  examName,
  score,
  cutScore,
  submittedAt,
  durationMinutes,
  results
}: ExamAttemptLogProps) {
  const statusLabel = score >= cutScore ? 'Aprovado' : 'Reprovado'
  const statusColor = score >= cutScore ? 'text-green-500' : 'text-red-500'

  return (
    <div className="border border-border bg-card">
      <div className="p-4 border-b border-border flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">{courseName}</p>
          <p className="text-sm text-foreground">{studentName}</p>
          <p className="text-xs text-[#6b7a5f]">{examName}</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold ${statusColor}`}>{statusLabel}</p>
          <p className="text-xs text-[#6b7a5f]">{score}% / corte {cutScore}%</p>
          <p className="text-[10px] text-[#6b7a5f]">{submittedAt} • {durationMinutes} min</p>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {results.map((result, index) => (
          <div key={result.id} className="flex items-center justify-between border border-border bg-secondary/30 px-3 py-2">
            <span className="text-xs text-[#6b7a5f]">Q{index + 1}</span>
            <span className="text-sm text-foreground flex-1 px-3">{result.prompt}</span>
            <span className={result.correct ? 'text-green-500 text-xs' : 'text-red-500 text-xs'}>
              {result.correct ? 'Correta' : 'Incorreta'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
