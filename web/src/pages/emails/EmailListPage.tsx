import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { api } from '@/lib/api'
import type { Email } from '@/types'
import { Plus, Pencil, CalendarX, Trash2 } from 'lucide-react'

type StatusTab = 'draft' | 'scheduled' | 'sent'

function StatusBadge({ status }: { status: Email['status'] }) {
  const { t } = useTranslation()
  const colorMap: Record<string, string> = {
    draft: 'bg-secondary text-secondary-foreground',
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    sending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    sent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  const labelMap: Record<string, string> = {
    draft: t('emails.drafts'),
    scheduled: t('emails.scheduled'),
    sending: t('common.loading'),
    sent: t('emails.sent'),
    failed: t('emails.failed'),
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorMap[status] ?? ''}`}>
      {labelMap[status] ?? status}
    </span>
  )
}

export function EmailListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tab, setTab] = useState<StatusTab>('draft')
  const [emails, setEmails] = useState<Email[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ results: Email[]; total: number }>(`/emails?status=${tab}&limit=50`)
      setEmails(data.results)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { load() }, [load])

  const handleCancelSchedule = async (email: Email) => {
    if (!window.confirm(t('emails.confirmCancelSchedule'))) return
    await api.post(`/emails/${email.id}/cancel`)
    load()
  }

  const handleDelete = async (email: Email) => {
    if (!window.confirm(t('emails.confirmDelete'))) return
    await api.delete(`/emails/${email.id}`)
    load()
  }

  const tabs: { key: StatusTab; label: string }[] = [
    { key: 'draft', label: t('emails.drafts') },
    { key: 'scheduled', label: t('emails.scheduled') },
    { key: 'sent', label: t('emails.sent') },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('emails.title')}</h1>
        <button
          onClick={() => navigate('/emails/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          {t('emails.newEmail')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
      ) : emails.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">{t('emails.noEmails')}</div>
      ) : (
        <div className="border rounded-lg divide-y">
          {emails.map((email) => (
            <div key={email.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {email.subject || <span className="text-muted-foreground italic">(no subject)</span>}
                  </span>
                  <StatusBadge status={email.status} />
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {email.scheduled_at && (
                    <span>
                      {t('emails.scheduledAt')}: {new Date(email.scheduled_at).toLocaleString()}
                    </span>
                  )}
                  {email.sent_at && (
                    <span>
                      {t('emails.sent')}: {new Date(email.sent_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {['draft', 'scheduled'].includes(email.status) && (
                  <button
                    onClick={() => navigate(`/emails/${email.id}/edit`)}
                    className="p-1.5 rounded hover:bg-accent text-muted-foreground"
                    title={t('common.edit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                {email.status === 'scheduled' && (
                  <button
                    onClick={() => handleCancelSchedule(email)}
                    className="p-1.5 rounded hover:bg-accent text-muted-foreground"
                    title={t('emails.cancelSchedule')}
                  >
                    <CalendarX className="w-4 h-4" />
                  </button>
                )}
                {['draft', 'scheduled'].includes(email.status) && (
                  <button
                    onClick={() => handleDelete(email)}
                    className="p-1.5 rounded hover:bg-accent text-destructive"
                    title={t('emails.deleteEmail')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {total > emails.length && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {emails.length} of {total}
        </p>
      )}
    </div>
  )
}
