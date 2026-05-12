import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import type { EmailTemplate } from '@/types'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { Plus, Pencil, Trash2, Globe, Lock, ArrowRight } from 'lucide-react'

interface TemplateFormData {
  name: string
  subject: string
  body_html: string
  body_json: string
  is_public: boolean
}

const emptyForm = (): TemplateFormData => ({
  name: '', subject: '', body_html: '', body_json: '{}', is_public: false,
})

export function TemplatesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [form, setForm] = useState<TemplateFormData>(emptyForm())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<EmailTemplate[]>('/templates')
      setTemplates(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (tpl: EmailTemplate) => {
    setEditing(tpl)
    setForm({
      name: tpl.name,
      subject: tpl.subject,
      body_html: tpl.body_html,
      body_json: tpl.body_json,
      is_public: tpl.is_public === 1,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await api.put(`/templates/${editing.id}`, form)
    } else {
      await api.post('/templates', form)
    }
    setShowForm(false)
    setEditing(null)
    load()
  }

  const handleDelete = async (tpl: EmailTemplate) => {
    if (!window.confirm(t('templates.confirmDelete', { name: tpl.name }))) return
    await api.delete(`/templates/${tpl.id}`)
    load()
  }

  const handleUse = (tpl: EmailTemplate) => {
    navigate('/emails/new', { state: { template: tpl } })
  }

  const currentUserId = user?.id ?? ''
  const myTemplates = templates.filter(tpl => tpl.user_id === currentUserId)
  const publicTemplates = templates.filter(tpl => tpl.user_id !== currentUserId && tpl.is_public === 1)

  const renderList = (list: EmailTemplate[], isOwner: boolean) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map((tpl) => (
        <div key={tpl.id} className="border rounded-lg p-4 bg-card space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{tpl.name}</div>
              {tpl.subject && (
                <div className="text-xs text-muted-foreground truncate">{tpl.subject}</div>
              )}
            </div>
            <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
              tpl.is_public ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-secondary text-secondary-foreground'
            }`}>
              {tpl.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {tpl.is_public ? t('templates.isPublic') : t('templates.isPrivate')}
            </span>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => handleUse(tpl)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              {t('templates.useTemplate')}
              <ArrowRight className="w-3 h-3" />
            </button>
            {isOwner && (
              <>
                <button
                  onClick={() => openEdit(tpl)}
                  className="p-1.5 rounded hover:bg-accent text-muted-foreground"
                  title={t('common.edit')}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(tpl)}
                  className="p-1.5 rounded hover:bg-accent text-destructive"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('templates.title')}</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          {t('templates.addTemplate')}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="font-medium mb-4">
            {editing ? t('templates.editTemplate') : t('templates.addTemplate')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('templates.templateName')} *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('templates.subject')}</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('emails.preview')}</label>
              <RichTextEditor
                initialJson={form.body_json !== '{}' ? form.body_json : undefined}
                onChange={(json, html) => setForm(f => ({ ...f, body_json: JSON.stringify(json), body_html: html }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_public"
                checked={form.is_public}
                onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="is_public" className="text-sm">{t('templates.isPublic')}</label>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null) }}
                className="px-4 py-2 text-sm border rounded-md hover:bg-accent"
              >
                {t('common.cancel')}
              </button>
              <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
      ) : (
        <>
          {/* My Templates */}
          <section>
            <h2 className="text-lg font-semibold mb-3">{t('templates.myTemplates')}</h2>
            {myTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('templates.noTemplates')}</p>
            ) : renderList(myTemplates, true)}
          </section>

          {/* Public Templates from others */}
          {publicTemplates.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">{t('templates.publicTemplates')}</h2>
              {renderList(publicTemplates, false)}
            </section>
          )}
        </>
      )}
    </div>
  )
}
