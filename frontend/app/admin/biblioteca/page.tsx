"use client"

import { useMemo, useState } from "react"
import { FileText, Link2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type LibraryItemType } from "@/lib/admin-library"
import { useCombatContext } from "@/contexts/CombatContext"

export default function LibraryPage() {
  const {
    bibliotecaArquivos,
    adicionarArquivoBiblioteca,
    atualizarArquivoBiblioteca,
    removerArquivoBiblioteca
  } = useCombatContext()
  const [newItem, setNewItem] = useState({
    title: "",
    type: "pdf" as LibraryItemType,
    url: "",
    tags: ""
  })
  const [search, setSearch] = useState("")
  const [tagFilter, setTagFilter] = useState("")

  const handleAddItem = () => {
    if (!newItem.title || !newItem.url) {
      return
    }

    adicionarArquivoBiblioteca({
      title: newItem.title,
      type: newItem.type,
      url: newItem.url,
      tags: newItem.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    })
    setNewItem({ title: "", type: "pdf", url: "", tags: "" })
  }

  const filteredItems = useMemo(() => {
    return bibliotecaArquivos.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.url.toLowerCase().includes(search.toLowerCase())
      const matchesTag = tagFilter
        ? item.tags.some((tag) => tag.toLowerCase().includes(tagFilter.toLowerCase()))
        : true
      return matchesSearch && matchesTag
    })
  }, [bibliotecaArquivos, search, tagFilter])

  return (
    <div className="space-y-6">
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
          <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
            <Input
              placeholder="Buscar por titulo ou URL"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-border bg-secondary rounded-none"
            />
            <Input
              placeholder="Filtrar por tag"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="border-border bg-secondary rounded-none"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredItems.map((item) => (
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
                    <input
                      value={item.title}
                      onChange={(e) => atualizarArquivoBiblioteca(item.id, { title: e.target.value })}
                      className="text-sm font-bold text-foreground bg-transparent border-b border-transparent focus:border-[#F4511E] outline-none w-full"
                    />
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
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <Input
                  value={item.url}
                  onChange={(e) => atualizarArquivoBiblioteca(item.id, { url: e.target.value })}
                  className="border-border bg-secondary rounded-none"
                />
                <Input
                  value={item.tags.join(", ")}
                  onChange={(e) =>
                    atualizarArquivoBiblioteca(item.id, {
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                    })
                  }
                  className="border-border bg-secondary rounded-none"
                />
                <Button
                  onClick={() => removerArquivoBiblioteca(item.id)}
                  variant="outline"
                  className="border-[#6b7a5f] text-[#6b7a5f] rounded-none"
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
    </div>
  )
}
