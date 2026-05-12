import { Hono } from 'hono'
import { getTablePrefix } from '../types'
import type { HonoEnv } from '../types'
import { authMiddleware, getEffectiveUserId } from '../middleware/auth'
import {
  listEmails, getEmail, getEmailRecipients, createEmail, updateEmail,
  replaceRecipients, deleteEmail, scheduleEmail, cancelEmailSchedule
} from '../db/queries/emails'

export const emailsRoutes = new Hono<HonoEnv>()

emailsRoutes.use('*', authMiddleware)

emailsRoutes.get('/', async (c) => {
  const userId = getEffectiveUserId(c)
  const prefix = getTablePrefix(c.env)
  const status = c.req.query('status')
  const limit = parseInt(c.req.query('limit') ?? '20', 10)
  const offset = parseInt(c.req.query('offset') ?? '0', 10)
  const { results, total } = await listEmails(c.env.DB, prefix, userId, status, limit, offset)
  return c.json({ results, total })
})

emailsRoutes.post('/', async (c) => {
  const userId = getEffectiveUserId(c)
  const prefix = getTablePrefix(c.env)
  const body = await c.req.json<{
    subject?: string
    body_html?: string
    body_json?: string
    recipients?: { contact_id?: string; name: string; email: string }[]
  }>()

  const email = await createEmail(c.env.DB, prefix, {
    user_id: userId,
    subject: body.subject,
    body_html: body.body_html,
    body_json: body.body_json,
  }, body.recipients ?? [])

  return c.json(email, 201)
})

emailsRoutes.get('/:id', async (c) => {
  const userId = getEffectiveUserId(c)
  const prefix = getTablePrefix(c.env)
  const id = c.req.param('id')

  const email = await getEmail(c.env.DB, prefix, userId, id)
  if (!email) return c.json({ error: 'Email not found' }, 404)

  const recipients = await getEmailRecipients(c.env.DB, prefix, id)
  return c.json({ ...email, recipients })
})

emailsRoutes.put('/:id', async (c) => {
  const userId = getEffectiveUserId(c)
  const prefix = getTablePrefix(c.env)
  const id = c.req.param('id')
  const body = await c.req.json<{
    subject?: string
    body_html?: string
    body_json?: string
    recipients?: { contact_id?: string; name: string; email: string }[]
  }>()

  const existing = await getEmail(c.env.DB, prefix, userId, id)
  if (!existing) return c.json({ error: 'Email not found' }, 404)
  if (!['draft', 'scheduled'].includes(existing.status)) {
    return c.json({ error: 'Cannot update email in current status' }, 400)
  }

  const { recipients, ...emailData } = body
  await updateEmail(c.env.DB, prefix, userId, id, emailData)

  if (recipients) {
    await replaceRecipients(c.env.DB, prefix, id, recipients)
  }

  return c.json({ success: true })
})

emailsRoutes.delete('/:id', async (c) => {
  const userId = getEffectiveUserId(c)
  const prefix = getTablePrefix(c.env)
  const id = c.req.param('id')

  const existing = await getEmail(c.env.DB, prefix, userId, id)
  if (!existing) return c.json({ error: 'Email not found' }, 404)
  if (!['draft', 'scheduled'].includes(existing.status)) {
    return c.json({ error: 'Cannot delete email in current status' }, 400)
  }

  await deleteEmail(c.env.DB, prefix, userId, id)
  return c.json({ success: true })
})

emailsRoutes.post('/:id/schedule', async (c) => {
  const userId = getEffectiveUserId(c)
  const prefix = getTablePrefix(c.env)
  const id = c.req.param('id')
  const body = await c.req.json<{ scheduled_at?: string }>()

  if (!body.scheduled_at) {
    return c.json({ error: 'scheduled_at is required' }, 400)
  }

  const existing = await getEmail(c.env.DB, prefix, userId, id)
  if (!existing) return c.json({ error: 'Email not found' }, 404)
  if (!['draft', 'scheduled'].includes(existing.status)) {
    return c.json({ error: 'Cannot schedule email in current status' }, 400)
  }

  const recipients = await getEmailRecipients(c.env.DB, prefix, id)
  if (recipients.length === 0) {
    return c.json({ error: 'Cannot schedule email without recipients' }, 400)
  }

  const ok = await scheduleEmail(c.env.DB, prefix, userId, id, body.scheduled_at)
  if (!ok) return c.json({ error: 'Failed to schedule email' }, 400)
  return c.json({ success: true })
})

emailsRoutes.post('/:id/cancel', async (c) => {
  const userId = getEffectiveUserId(c)
  const prefix = getTablePrefix(c.env)
  const id = c.req.param('id')

  const existing = await getEmail(c.env.DB, prefix, userId, id)
  if (!existing) return c.json({ error: 'Email not found' }, 404)
  if (existing.status !== 'scheduled') {
    return c.json({ error: 'Only scheduled emails can be cancelled' }, 400)
  }

  const ok = await cancelEmailSchedule(c.env.DB, prefix, userId, id)
  if (!ok) return c.json({ error: 'Failed to cancel schedule' }, 400)
  return c.json({ success: true })
})
