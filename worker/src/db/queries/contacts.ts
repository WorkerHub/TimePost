export interface Contact {
  id: string
  user_id: string
  name: string
  email: string
  notes: string | null
  tags: string | null
  created_at: string
  updated_at: string
}

export async function listContacts(
  db: D1Database,
  prefix: string,
  userId: string,
  query?: string
): Promise<Contact[]> {
  const table = `${prefix}contacts`
  if (query) {
    return db
      .prepare(`SELECT * FROM ${table} WHERE user_id = ? AND (name LIKE ? OR email LIKE ?) ORDER BY name ASC`)
      .bind(userId, `%${query}%`, `%${query}%`)
      .all<Contact>()
      .then(r => r.results)
  }
  return db
    .prepare(`SELECT * FROM ${table} WHERE user_id = ? ORDER BY name ASC`)
    .bind(userId)
    .all<Contact>()
    .then(r => r.results)
}

export async function findContactById(
  db: D1Database,
  prefix: string,
  userId: string,
  id: string
): Promise<Contact | null> {
  const table = `${prefix}contacts`
  return db
    .prepare(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .first<Contact>()
}

export async function createContact(
  db: D1Database,
  prefix: string,
  data: { user_id: string; name: string; email: string; notes?: string; tags?: string }
): Promise<Contact> {
  const table = `${prefix}contacts`
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await db
    .prepare(`INSERT INTO ${table} (id, user_id, name, email, notes, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, data.user_id, data.name, data.email, data.notes ?? null, data.tags ?? null, now, now)
    .run()
  return { id, user_id: data.user_id, name: data.name, email: data.email, notes: data.notes ?? null, tags: data.tags ?? null, created_at: now, updated_at: now }
}

export async function updateContact(
  db: D1Database,
  prefix: string,
  userId: string,
  id: string,
  data: Partial<Pick<Contact, 'name' | 'email' | 'notes' | 'tags'>>
): Promise<void> {
  const table = `${prefix}contacts`
  const now = new Date().toISOString()
  const allowedCols = new Set(['name', 'email', 'notes', 'tags'])
  const entries = (Object.entries(data) as [string, unknown][]).filter(([col]) => allowedCols.has(col))
  if (entries.length === 0) return

  const setClauses = entries.map(([col]) => `${col} = ?`).join(', ')
  const values = entries.map(([, val]) => val)

  await db
    .prepare(`UPDATE ${table} SET ${setClauses}, updated_at = ? WHERE id = ? AND user_id = ?`)
    .bind(...values, now, id, userId)
    .run()
}

export async function deleteContact(
  db: D1Database,
  prefix: string,
  userId: string,
  id: string
): Promise<void> {
  const table = `${prefix}contacts`
  await db
    .prepare(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .run()
}
