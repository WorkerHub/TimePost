import { Hono } from 'hono'
import { getTablePrefix } from '../types'
import type { HonoEnv } from '../types'
import { authMiddleware, getEffectiveUserId } from '../middleware/auth'
import { listTemplates, createTemplate, updateTemplate, deleteTemplate } from '../db/queries/templates'

export const templatesRoutes = new Hono<HonoEnv>()

templatesRoutes.use('*', authMiddleware)

templatesRoutes.get('/', async (c) => {
  const userId = getEffectiveUserId(c)
  const prefix = getTablePrefix(c.env)
  const templates = await listTemplates(c.env.DB, prefix, userId)
  return c.json(templates)
})

templatesRoutes.post('/', async (c) => {
  const userId = getEffectiveUserId(c)
  const prefix = getTablePrefix(c.env)
  const body = await c.req.json<{ name?: string; subject?: string; body_html?: string; body_json?: string; is_public?: boolean }>()

  if (!body.name) {
    return c.json({ error: 'Template name is required' }, 400)
  }

  const template = await createTemplate(c.env.DB, prefix, {
    user_id: userId,
    name: body.name,
    subject: body.subject,
    body_html: body.body_html,
    body_json: body.body_json,
    is_public: body.is_public,
  })
  return c.json(template, 201)
})

templatesRoutes.put('/:id', async (c) => {
  const userId = getEffectiveUserId(c)
  const prefix = getTablePrefix(c.env)
  const id = c.req.param('id')
  const body = await c.req.json<{ name?: string; subject?: string; body_html?: string; body_json?: string; is_public?: boolean }>()

  const { is_public, ...rest } = body
  const ok = await updateTemplate(c.env.DB, prefix, userId, id, {
    ...rest,
    ...(is_public !== undefined ? { is_public: is_public ? 1 : 0 } : {}),
  })
  if (!ok) return c.json({ error: 'Template not found or not owned by you' }, 404)
  return c.json({ success: true })
})

templatesRoutes.delete('/:id', async (c) => {
  const userId = getEffectiveUserId(c)
  const prefix = getTablePrefix(c.env)
  const id = c.req.param('id')

  const ok = await deleteTemplate(c.env.DB, prefix, userId, id)
  if (!ok) return c.json({ error: 'Template not found or not owned by you' }, 404)
  return c.json({ success: true })
})
