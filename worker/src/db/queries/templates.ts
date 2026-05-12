export interface EmailTemplate {
  id: string
  user_id: string
  name: string
  subject: string
  body_html: string
  body_json: string
  is_public: number
  created_at: string
  updated_at: string
}

export async function listTemplates(
  db: D1Database,
  prefix: string,
  userId: string
): Promise<EmailTemplate[]> {
  const table = `${prefix}email_templates`
  return db
    .prepare(`SELECT * FROM ${table} WHERE user_id = ? OR is_public = 1 ORDER BY updated_at DESC`)
    .bind(userId)
    .all<EmailTemplate>()
    .then(r => r.results)
}

export async function findTemplateById(
  db: D1Database,
  prefix: string,
  userId: string,
  id: string
): Promise<EmailTemplate | null> {
  const table = `${prefix}email_templates`
  return db
    .prepare(`SELECT * FROM ${table} WHERE id = ? AND (user_id = ? OR is_public = 1)`)
    .bind(id, userId)
    .first<EmailTemplate>()
}

export async function createTemplate(
  db: D1Database,
  prefix: string,
  data: { user_id: string; name: string; subject?: string; body_html?: string; body_json?: string; is_public?: boolean }
): Promise<EmailTemplate> {
  const table = `${prefix}email_templates`
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const isPublic = data.is_public ? 1 : 0
  await db
    .prepare(`INSERT INTO ${table} (id, user_id, name, subject, body_html, body_json, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, data.user_id, data.name, data.subject ?? '', data.body_html ?? '', data.body_json ?? '{}', isPublic, now, now)
    .run()
  return {
    id, user_id: data.user_id, name: data.name, subject: data.subject ?? '',
    body_html: data.body_html ?? '', body_json: data.body_json ?? '{}',
    is_public: isPublic, created_at: now, updated_at: now,
  }
}

export async function updateTemplate(
  db: D1Database,
  prefix: string,
  userId: string,
  id: string,
  data: Partial<Pick<EmailTemplate, 'name' | 'subject' | 'body_html' | 'body_json' | 'is_public'>>
): Promise<boolean> {
  const table = `${prefix}email_templates`
  const now = new Date().toISOString()
  const allowedCols = new Set(['name', 'subject', 'body_html', 'body_json', 'is_public'])
  const entries = (Object.entries(data) as [string, unknown][]).filter(([col]) => allowedCols.has(col))
  if (entries.length === 0) return false

  const setClauses = entries.map(([col]) => `${col} = ?`).join(', ')
  const values = entries.map(([, val]) => val)

  const result = await db
    .prepare(`UPDATE ${table} SET ${setClauses}, updated_at = ? WHERE id = ? AND user_id = ?`)
    .bind(...values, now, id, userId)
    .run()
  return result.meta.changes > 0
}

export async function deleteTemplate(
  db: D1Database,
  prefix: string,
  userId: string,
  id: string
): Promise<boolean> {
  const table = `${prefix}email_templates`
  const result = await db
    .prepare(`DELETE FROM ${table} WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .run()
  return result.meta.changes > 0
}
