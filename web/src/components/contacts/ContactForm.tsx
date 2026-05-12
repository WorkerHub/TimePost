import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Contact } from '@/types'

interface ContactFormProps {
  contact?: Contact
  onSubmit: (data: { name: string; email: string; notes: string; tags: string }) => void
  onCancel: () => void
}

export function ContactForm({ contact, onSubmit, onCancel }: ContactFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(contact?.name ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [notes, setNotes] = useState(contact?.notes ?? '')
  const [tagInput, setTagInput] = useState<string>(contact?.tags ? (JSON.parse(contact.tags) as string[]).join(', ') : '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tags = tagInput
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
    onSubmit({ name, email, notes, tags: JSON.stringify(tags) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t('contacts.name', { defaultValue: 'Name' })} *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('contacts.email', { defaultValue: 'Email' })} *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('contacts.notes', { defaultValue: 'Notes' })}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('contacts.tags', { defaultValue: 'Tags' })}</label>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder={t('contacts.tagsPlaceholder', { defaultValue: 'Comma separated, e.g. Colleague, VIP' })}
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm border rounded-md hover:bg-accent">
          {t('common.cancel', { defaultValue: 'Cancel' })}
        </button>
        <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          {contact ? t('common.save', { defaultValue: 'Save' }) : t('common.add', { defaultValue: 'Add' })}
        </button>
      </div>
    </form>
  )
}
