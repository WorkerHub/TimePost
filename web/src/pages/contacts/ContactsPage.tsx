import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import type { Contact } from '@/types'
import { ContactForm } from '@/components/contacts/ContactForm'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

export function ContactsPage() {
  const { t } = useTranslation()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<Contact[]>(`/contacts${query ? `?q=${encodeURIComponent(query)}` : ''}`)
      setContacts(data)
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (data: { name: string; email: string; notes: string; tags: string }) => {
    if (editing) {
      await api.put(`/contacts/${editing.id}`, data)
    } else {
      await api.post('/contacts', data)
    }
    setShowForm(false)
    setEditing(null)
    load()
  }

  const handleDelete = async (c: Contact) => {
    if (!window.confirm(t('common.confirmDelete', { name: c.name }))) return
    await api.delete(`/contacts/${c.id}`)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('contacts.title')}</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          {t('contacts.addContact')}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('contacts.search')}
          className="w-full pl-9 pr-4 py-2 border rounded-md text-sm"
        />
      </div>

      {/* Form */}
      {showForm && (
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-medium mb-3">
            {editing ? t('contacts.editContact') : t('contacts.addContact')}
          </h2>
          <ContactForm
            contact={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditing(null) }}
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
      ) : contacts.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">{t('contacts.noContacts')}</div>
      ) : (
        <div className="border rounded-lg divide-y">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium text-sm">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.email}</div>
                {c.tags && (() => {
                  try {
                    const tags: string[] = JSON.parse(c.tags)
                    return tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tags.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-secondary text-secondary-foreground text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null
                  } catch { return null }
                })()}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditing(c); setShowForm(true) }}
                  className="p-1.5 rounded hover:bg-accent text-muted-foreground"
                  title={t('common.edit')}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="p-1.5 rounded hover:bg-accent text-destructive"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
