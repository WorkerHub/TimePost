import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, useLocation } from 'react-router'
import { api } from '@/lib/api'
import type { Email, EmailTemplate } from '@/types'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { EmailPreview } from '@/components/editor/EmailPreview'
import { ContactSelector } from '@/components/contacts/ContactSelector'
import { ChevronLeft, Save, Clock, X } from 'lucide-react'

interface Recipient {
  contact_id?: string
  name: string
  email: string
}

export function EmailEditorPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [bodyJson, setBodyJson] = useState('{}')
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)

  // Schedule state
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleHour, setScheduleHour] = useState('09')

  // Template selector state
  const [showTemplates, setShowTemplates] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])

  // Load existing email or apply template from navigation state
  useEffect(() => {
    if (!id) {
      const state = location.state as { template?: EmailTemplate } | null
      if (state?.template) {
        const tpl = state.template
        setSubject(tpl.subject)
        setBodyHtml(tpl.body_html)
        setBodyJson(tpl.body_json)
      }
      return
    }
    api.get<Email & { recipients: Recipient[] }>(`/emails/${id}`)
      .then(data => {
        setSubject(data.subject)
        setBodyHtml(data.body_html)
        setBodyJson(data.body_json)
        setRecipients(data.recipients ?? [])
      })
      .finally(() => setLoading(false))
  }, [id, location.state])

  const saveEmail = async (): Promise<string> => {
    const payload = { subject, body_html: bodyHtml, body_json: bodyJson, recipients }
    if (id) {
      await api.put(`/emails/${id}`, payload)
      return id
    } else {
      const created = await api.post<{ id: string }>('/emails', payload)
      return created.id
    }
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      const emailId = await saveEmail()
      if (!id) {
        navigate(`/emails/${emailId}/edit`, { replace: true })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSchedule = async () => {
    if (!scheduleDate || !scheduleHour) return
    setSaving(true)
    try {
      const emailId = await saveEmail()
      const scheduledAt = new Date(`${scheduleDate}T${scheduleHour.padStart(2, '0')}:00:00`).toISOString()
      await api.post(`/emails/${emailId}/schedule`, { scheduled_at: scheduledAt })
      navigate('/emails')
    } finally {
      setSaving(false)
    }
  }

  const loadTemplates = async () => {
    const data = await api.get<EmailTemplate[]>('/templates')
    setTemplates(data)
    setShowTemplates(true)
  }

  const applyTemplate = (tpl: EmailTemplate) => {
    setSubject(tpl.subject)
    setBodyHtml(tpl.body_html)
    setBodyJson(tpl.body_json)
    setShowTemplates(false)
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground p-6">{t('common.loading')}</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/emails')}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold flex-1">
          {id ? t('emails.editEmail') : t('emails.newEmail')}
        </h1>
        <button
          onClick={loadTemplates}
          className="px-3 py-1.5 text-sm border rounded-md hover:bg-accent"
        >
          {t('emails.applyTemplate')}
        </button>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium mb-1">{t('emails.subject')}</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder={t('emails.subject')}
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
      </div>

      {/* Recipients */}
      <div>
        <label className="block text-sm font-medium mb-2">{t('emails.recipients')}</label>
        <ContactSelector selected={recipients} onChange={setRecipients} />
      </div>

      {/* Editor + Preview split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <RichTextEditor
            initialJson={bodyJson !== '{}' ? bodyJson : undefined}
            onChange={(json, html) => {
              setBodyJson(JSON.stringify(json))
              setBodyHtml(html)
            }}
          />
        </div>
        <div>
          <EmailPreview html={bodyHtml} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm border rounded-md hover:bg-accent disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {t('emails.saveDraft')}
        </button>
        <button
          onClick={() => setShowSchedule(!showSchedule)}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Clock className="w-4 h-4" />
          {t('emails.schedule')}
        </button>
      </div>

      {/* Schedule picker */}
      {showSchedule && (
        <div className="border rounded-lg p-4 bg-card flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">{t('emails.date')}</label>
            <input
              type="date"
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('emails.hour')}</label>
            <select
              value={scheduleHour}
              onChange={e => setScheduleHour(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                <option key={h} value={h}>{h}:00</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSchedule}
            disabled={saving || !scheduleDate}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {t('emails.schedule')}
          </button>
          <button
            onClick={() => setShowSchedule(false)}
            className="p-2 text-muted-foreground hover:bg-accent rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Template selector modal */}
      {showTemplates && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowTemplates(false)}
        >
          <div
            className="bg-card border rounded-lg p-4 w-full max-w-lg max-h-[70vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">{t('emails.applyTemplate')}</h2>
              <button onClick={() => setShowTemplates(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('templates.noTemplates')}</p>
            ) : (
              <div className="space-y-1">
                {templates.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-accent text-sm"
                  >
                    <div className="font-medium">{tpl.name}</div>
                    {tpl.subject && <div className="text-xs text-muted-foreground">{tpl.subject}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
