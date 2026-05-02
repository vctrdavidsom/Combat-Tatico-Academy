'use client'

import { useEffect, useRef } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

const toolbarActions = [
  { label: 'Negrito', command: 'bold' },
  { label: 'Italico', command: 'italic' },
  { label: 'Sublinhado', command: 'underline' },
  { label: 'Lista', command: 'insertUnorderedList' },
  { label: 'Numerada', command: 'insertOrderedList' }
]

export function RichTextEditor({
  value,
  onChange,
  label,
  placeholder = 'Digite o manual tatico...'
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const execCommand = (command: string) => {
    if (!editorRef.current) {
      return
    }
    editorRef.current.focus()
    document.execCommand(command, false)
    onChange(editorRef.current.innerHTML)
  }

  const handleInput = () => {
    if (!editorRef.current) {
      return
    }
    onChange(editorRef.current.innerHTML)
  }

  const isEmpty = !value || value === '<br>'

  return (
    <div className="border border-border bg-card">
      {label && (
        <div className="p-3 border-b border-border text-xs text-[#6b7a5f] uppercase tracking-wider">
          {label}
        </div>
      )}
      <div className="flex flex-wrap gap-2 p-2 border-b border-border bg-secondary/40">
        {toolbarActions.map((action) => (
          <button
            key={action.command}
            type="button"
            onClick={() => execCommand(action.command)}
            className="px-2 py-1 text-[10px] uppercase tracking-wider border border-border text-[#6b7a5f] hover:text-[#F4511E] hover:border-[#F4511E]"
          >
            {action.label}
          </button>
        ))}
      </div>
      <div className="relative p-3">
        {isEmpty && (
          <p className="pointer-events-none absolute left-3 top-3 text-xs text-[#6b7a5f]">
            {placeholder}
          </p>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          className="min-h-[140px] text-sm text-foreground outline-none"
        />
      </div>
    </div>
  )
}
