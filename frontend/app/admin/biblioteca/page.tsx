"use client"

import { useState } from "react"
import { FileText, Link2, Plus } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { initialLibraryItems, type LibraryItem, type LibraryItemType } from "@/lib/admin-library"

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>(initialLibraryItems)
  const [newItem, setNewItem] = useState({
    title: "",
    type: "pdf" as LibraryItemType,
    url: "",
    tags: ""
  })

  const handleAddItem = () => {
    if (!newItem.title || !newItem.url) {
      return
    }

    const nextId = Math.max(0, ...items.map((item) => item.id)) + 1
    setItems((prev) => [
      ...prev,
      {
        id: nextId,
        title: newItem.title,
        type: newItem.type,
        url: newItem.url,
        tags: newItem.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        updatedAt: new Date().toLocaleDateString('pt-BR')
      }
    ])
    setNewItem({ title: "", type: "pdf", url: "", tags: "" })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userName="Comandante Admin" isAdmin />

      <main className="p-4 md:p-6 space-y-6">
        <div className="border border-border bg-card p-4">
          <h1 className="text-lg font-bold text-foreground">Biblioteca Global</h1>
          <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
            Repositorio central de PDFs e links reutilizaveis
          </p>
        </div>

        <div className="border border-border bg-card p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_120px_1fr_1fr_auto]">
            <Input
              placeholder="Titulo do material"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              className="border-border bg-secondary rounded-none"
            />
            <select
              value={newItem.type}
              onChange={(e) => setNewItem({ ...newItem, type: e.target.value as LibraryItemType })}
              className="border border-border bg-secondary text-xs uppercase tracking-wider rounded-none px-2 py-2 text-[#6b7a5f]"
            >
              <option value="pdf">PDF</option>
              <option value="link">Link</option>
            </select>
            <Input
              placeholder="URL do arquivo"
              value={newItem.url}
              onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
              className="border-border bg-secondary rounded-none"
            />
            <Input
              placeholder="Tags (separadas por virgula)"
              value={newItem.tags}
              onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
              className="border-border bg-secondary rounded-none"
            />
            <Button
              onClick={handleAddItem}
              className="bg-[#F4511E] hover:bg-[#F4511E]/90 text-white rounded-none"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="border border-border bg-card p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
                    {item.type === 'pdf' ? (
                      <FileText className="h-5 w-5 text-[#F4511E]" />
                    ) : (
                      <Link2 className="h-5 w-5 text-[#F4511E]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{item.title}</p>
                    <p className="text-xs text-[#6b7a5f] break-all">{item.url}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-[#6b7a5f]">
                  Atualizado em {item.updatedAt}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {item.tags.map((tag) => (
                  <span key={tag} className="text-[10px] uppercase tracking-wider px-2 py-1 border border-border text-[#6b7a5f]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
