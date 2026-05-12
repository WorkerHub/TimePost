import { Hono } from 'hono'
import { getTablePrefix } from '../types'
import type { HonoEnv } from '../types'
import { authMiddleware, getEffectiveUserId } from '../middleware/auth'
import { listContacts, findContactById, createContact, updateContact, deleteContact } from '../db/queries/contacts'

export const contactsRoutes = new Hono<HonoEnv>()

contactsRoutes.use('*', authMiddleware)

contactsRoutes.get('/', async (c) => {
  const userId = getEffectiveUserId(c)
  const prefix = getTablePrefix(c.env)
  const q = c.req.query('q')
  const contacts = await listContacts(c.env.DB, prefix, userId, q)
  return c.json(contacts)
})

contactsRoutes.post('/', async (c) => {
  const userId = getEffectiveUserId(c)
  const prefix = getTablePrefix(c.env)
  const body = await c.req.json<{ name?: string; email?: string; notes?: string; tags?: string }>()

  if (!body.name || !body.email) {
    return c.json({ error: 'Name and email are required' }, 400)
  }

  const contact = await createContact(c.env.DB, prefix, {
    user_id: userId,
    name: body.name,
    email: body.email,
    notes: body.notes,
    tags: body.tags,
  })
  return c.json(contact, 201)
})

contactsRoutes.put('/:id', async (c) => {
  const userId = getEffectiveUserId(c)
  const prefix = getTablePrefix(c.env)
  const id = c.req.param('id')
  const body = await c.req.json<{ name?: string; email?: string; notes?: string; tags?: string }>()

  const existing = await findContactById(c.env.DB, prefix, userId, id)
  if (!existing) return c.json({ error: 'Contact not found' }, 404)

  await updateContact(c.env.DB, prefix, userId, id, body)
  return c.json({ success: true })
})

contactsRoutes.delete('/:id', async (c) => {
  const userId = getEffectiveUserId(c)
  const prefix = getTablePrefix(c.env)
  const id = c.req.param('id')

  const existing = await findContactById(c.env.DB, prefix, userId, id)
  if (!existing) return c.json({ error: 'Contact not found' }, 404)

  await deleteContact(c.env.DB, prefix, userId, id)
  return c.json({ success: true })
})
