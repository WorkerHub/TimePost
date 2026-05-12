import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import type { Contact } from '@/types'
import { X, Search, ChevronDown } from 'lucide-react'

interface ContactSelectorProps {
  selected: { contact_id?: string; name: string; email: string }[]
  onChange: (recipients: { contact_id?: string; name: string; email: string }[]) => void
}

export function ContactSelector({ selected, onChange }: ContactSelectorProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [open, setOpen] = useState(false)
  const [manualEmail, setManualEmail] = useState('')
  const [manualName, setManualName] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      api.get<Contact[]>(`/contacts${query ? `?q=${encodeURIComponent(query)}` : ''}`)
        .then(setContacts)
        .catch(() => {})
    }
  }, [open, query])

  const isSelected = (contactId: string) => selected.some(r => r.contact_id === contactId)

  const toggleContact = (contact: Contact) => {
    if (isSelected(contact.id)) {
      onChange(selected.filter(r => r.contact_id !== contact.id))
    } else {
      onChange([...selected, { contact_id: contact.id, name: contact.name, email: contact.email }])
    }
  }

  const addManualRecipient = () => {
    if (!manualEmail) return
    onChange([...selected, { name: manualName || manualEmail, email: manualEmail }])
    setManualEmail('')
    setManualName('')
  }

  const removeRecipient = (index: number) => {
    onChange(selected.filter((_, i) => i !== index))
  }

  return (
    <div ref={ref} className="space-y-2">
      {/* Selected recipients */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((r, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md">
              {r.name} &lt;{r.email}&gt;
              <button type="button" onClick={() => removeRecipient(i)} className="hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger + manual input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 w-full px-3 py-2 border rounded-md text-sm text-left hover:bg-accent transition-colors"
          >
            <Search className="w-4 h-4 text-muted-foreground" />
            {t('emails.selectRecipients', { defaultValue: 'Select recipients from contacts...' })}
            <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
          </button>
          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
              <div className="p-2 border-b sticky top-0 bg-card">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('contacts.search', { defaultValue: 'Search contacts...' })}
                  className="w-full px-2 py-1.5 text-sm border rounded"
                  autoFocus
                />
              </div>
              {contacts.length === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  {t('contacts.noResults', { defaultValue: 'No contacts found' })}
                </div>
              ) : (
                contacts.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleContact(c)}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors ${
                      isSelected(c.id) ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isSelected(c.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'
                    }`}>
                      {isSelected(c.id) && <span className="text-xs">&#10003;</span>}
                    </div>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">&lt;{c.email}&gt;</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manual email input */}
      <div className="flex gap-2 items-end">
        <input
          type="text"
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
          placeholder={t('emails.recipientName', { defaultValue: 'Name (optional)' })}
          className="flex-1 px-3 py-2 border rounded-md text-sm"
        />
        <input
          type="email"
          value={manualEmail}
          onChange={(e) => setManualEmail(e.target.value)}
          placeholder={t('emails.recipientEmail', { defaultValue: 'Email address' })}
          className="flex-1 px-3 py-2 border rounded-md text-sm"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualRecipient() } }}
        />
        <button
          type="button"
          onClick={addManualRecipient}
          className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          {t('common.add', { defaultValue: 'Add' })}
        </button>
      </div>
    </div>
  )
}
