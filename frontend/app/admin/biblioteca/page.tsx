"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { FileText, Link2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type LibraryItemType = "pdf" | "link"

type LibraryItem = {
  id: number
  title: string
  type: LibraryItemType
  url: string
  tags: string[]
  updated_at: string
}

const API_BASE_URL = "/api"
const ACCESS_TOKEN_KEY = "cta_access_token"

const readJsonResponse = async <T,>(response: Response) => {
  const raw = await response.text()
  if (!raw) {
    return { data: null as T | null, raw: "" }
  }
  try {
    return { data: JSON.parse(raw) as T, raw }
  } catch {
    return { data: null as T | null, raw }
  }
}

const resolveApiError = (raw: string, data: unknown, fallback: string) => {
  const detail = (data as { detail?: unknown } | null)?.detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (item as { msg?: string })?.msg || JSON.stringify(item))
      .join(" | ")
  }
  if (typeof detail === "string") {
    return detail
  }
  if (detail) {
    return JSON.stringify(detail)
  }
  return raw || fallback
}

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [savingId, setSavingId] = useState<number | null>(null)
  const [newItem, setNewItem] = useState({
    title: "",
    type: "pdf" as LibraryItemType,
    url: "",
    tags: ""
  })
  const [search, setSearch] = useState("")
  const [tagFilter, setTagFilter] = useState("")

  const loadItems = useCallback(async () => {
    setError("")
    setIsLoading(true)
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setItems([])
        setError("Token nao encontrado. Faca login novamente.")
        return
      }

      const response = await fetch(`${API_BASE_URL}/library/admin/items`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const { data, raw } = await readJsonResponse<LibraryItem[] | { detail?: unknown }>(response)
      if (!response.ok) {
        setItems([])
        setError(resolveApiError(raw, data, "Erro ao carregar biblioteca."))
        return
      }

      setItems(Array.isArray(data) ? data : [])
    } catch {
      setItems([])
      setError("Falha ao conectar com o servidor.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleAddItem = async () => {
    if (!newItem.title || !newItem.url) {
      return
    }

    setError("")
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setError("Token nao encontrado. Faca login novamente.")
        return
      }

      const response = await fetch(`${API_BASE_URL}/library/admin/items`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: newItem.title,
          type: newItem.type,
          url: newItem.url,
          tags: newItem.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        })
      })

      const { data, raw } = await readJsonResponse<{ detail?: unknown }>(response)
      if (!response.ok) {
        setError(resolveApiError(raw, data, "Erro ao adicionar item."))
        return
      }

      setNewItem({ title: "", type: "pdf", url: "", tags: "" })
      await loadItems()
    } catch {
      setError("Falha ao conectar com o servidor.")
    }
  }

  const handleUpdateItem = async (itemId: number, patch: Partial<LibraryItem>) => {
    setError("")
    setSavingId(itemId)
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setError("Token nao encontrado. Faca login novamente.")
        return
      }

      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
      )

      const payload = {
        title: patch.title,
        type: patch.type,
        url: patch.url,
        tags: patch.tags
      }

      const response = await fetch(`${API_BASE_URL}/library/admin/items/${itemId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      const { data, raw } = await readJsonResponse<LibraryItem | { detail?: unknown }>(response)
      if (!response.ok) {
        setError(resolveApiError(raw, data, "Erro ao atualizar item."))
        return
      }

      if (data && typeof data === "object") {
        setItems((prev) =>
          prev.map((item) => (item.id === itemId ? (data as LibraryItem) : item))
        )
      }
    } catch {
      setError("Falha ao conectar com o servidor.")
    } finally {
      setSavingId(null)
    }
  }

  const handleRemoveItem = async (itemId: number) => {
    setError("")
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!token) {
        setError("Token nao encontrado. Faca login novamente.")
        return
      }

      const response = await fetch(`${API_BASE_URL}/library/admin/items/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const raw = await response.text()
        setError(raw || "Erro ao remover item.")
        return
      }

      setItems((prev) => prev.filter((item) => item.id !== itemId))
    } catch {
      setError("Falha ao conectar com o servidor.")
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.url.toLowerCase().includes(search.toLowerCase())
      const matchesTag = tagFilter
        ? item.tags.some((tag) => tag.toLowerCase().includes(tagFilter.toLowerCase()))
        : true
      return matchesSearch && matchesTag
    })
  }, [items, search, tagFilter])

  return (
    <div className="space-y-6">
      <div className="border border-border bg-card p-4">
        <h1 className="text-lg font-bold text-foreground">Biblioteca Global</h1>
        <p className="text-xs text-[#6b7a5f] uppercase tracking-wider">
          Repositorio central de PDFs e links reutilizaveis
        </p>
      </div>

      {error && (
        <div className="border border-border bg-card p-4 text-sm text-red-500">
          {error}
        </div>
      )}

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

      {isLoading ? (
        <div className="border border-border bg-card p-6 text-sm text-[#6b7a5f]">
          Carregando biblioteca...
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="border border-border bg-card p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-[#F4511E] bg-[#F4511E]/10">
                    {item.type === "pdf" ? (
                      <FileText className="h-5 w-5 text-[#F4511E]" />
                    ) : (
                      <Link2 className="h-5 w-5 text-[#F4511E]" />
                    )}
                  </div>
                  <div>
                    <input
                      value={item.title}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((entry) =>
                            entry.id === item.id
                              ? { ...entry, title: e.target.value }
                              : entry
                          )
                        )
                      }
                      onBlur={(e) =>
                        handleUpdateItem(item.id, { title: e.target.value })
                      }
                      className="text-sm font-bold text-foreground bg-transparent border-b border-transparent focus:border-[#F4511E] outline-none w-full"
                    />
                    <p className="text-xs text-[#6b7a5f] break-all">{item.url}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-[#6b7a5f]">
                  Atualizado em {new Date(item.updated_at).toLocaleDateString("pt-BR")}
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
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, url: e.target.value }
                          : entry
                      )
                    )
                  }
                  onBlur={(e) => handleUpdateItem(item.id, { url: e.target.value })}
                  className="border-border bg-secondary rounded-none"
                />
                <Input
                  value={item.tags.join(", ")}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((entry) =>
                        entry.id === item.id
                          ? {
                              ...entry,
                              tags: e.target.value
                                .split(",")
                                .map((tag) => tag.trim())
                                .filter(Boolean)
                            }
                          : entry
                      )
                    )
                  }
                  onBlur={(e) =>
                    handleUpdateItem(item.id, {
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                    })
                  }
                  className="border-border bg-secondary rounded-none"
                />
                <Button
                  onClick={() => handleRemoveItem(item.id)}
                  variant="outline"
                  className="border-[#6b7a5f] text-[#6b7a5f] rounded-none"
                  disabled={savingId === item.id}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
