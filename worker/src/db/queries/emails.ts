export interface Email {
  id: string
  user_id: string
  subject: string
  body_html: string
  body_json: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  scheduled_at: string | null
  sent_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface EmailRecipient {
  id: string
  email_id: string
  contact_id: string | null
  name: string
  email: string
}

export async function listEmails(
  db: D1Database,
  prefix: string,
  userId: string,
  status?: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ results: Email[]; total: number }> {
  const table = `${prefix}emails`
  if (status) {
    const countRow = await db
      .prepare(`SELECT COUNT(*) as count FROM ${table} WHERE user_id = ? AND status = ?`)
      .bind(userId, status)
      .first<{ count: number }>()
    const results = await db
      .prepare(`SELECT * FROM ${table} WHERE user_id = ? AND status = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?`)
      .bind(userId, status, limit, offset)
      .all<Email>()
    return { results: results.results, total: countRow?.count ?? 0 }
  }
  const countRow = await db
    .prepare(`SELECT COUNT(*) as count FROM ${table} WHERE user_id = ?`)
    .bind(userId)
    .first<{ count: number }>()
  const results = await db
    .prepare(`SELECT * FROM ${table} WHERE user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?`)
    .bind(userId, limit, offset)
    .all<Email>()
  return { results: results.results, total: countRow?.count ?? 0 }
}

export async function getEmail(
  db: D1Database,
  prefix: string,
  userId: string,
  id: string
): Promise<Email | null> {
  const table = `${prefix}emails`
  return db
    .prepare(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`)
    .bind(id, userId)
    .first<Email>()
}

export async function getEmailRecipients(
  db: D1Database,
  prefix: string,
  emailId: string
): Promise<EmailRecipient[]> {
  const table = `${prefix}email_recipients`
  return db
    .prepare(`SELECT * FROM ${table} WHERE email_id = ?`)
    .bind(emailId)
    .all<EmailRecipient>()
    .then(r => r.results)
}

export async function createEmail(
  db: D1Database,
  prefix: string,
  data: { user_id: string; subject?: string; body_html?: string; body_json?: string },
  recipients: { contact_id?: string; name: string; email: string }[]
): Promise<Email> {
  const table = `${prefix}emails`
  const recipientsTable = `${prefix}email_recipients`
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  await db
    .prepare(`INSERT INTO ${table} (id, user_id, subject, body_html, body_json, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)`)
    .bind(id, data.user_id, data.subject ?? '', data.body_html ?? '', data.body_json ?? '{}', now, now)
    .run()

  for (const r of recipients) {
    const rid = crypto.randomUUID()
    await db
      .prepare(`INSERT INTO ${recipientsTable} (id, email_id, contact_id, name, email) VALUES (?, ?, ?, ?, ?)`)
      .bind(rid, id, r.contact_id ?? null, r.name, r.email)
      .run()
  }

  return {
    id, user_id: data.user_id, subject: data.subject ?? '', body_html: data.body_html ?? '',
    body_json: data.body_json ?? '{}', status: 'draft', scheduled_at: null, sent_at: null,
    error_message: null, created_at: now, updated_at: now,
  }
}

export async function updateEmail(
  db: D1Database,
  prefix: string,
  userId: string,
  id: string,
  data: Partial<Pick<Email, 'subject' | 'body_html' | 'body_json'>>
): Promise<void> {
  const table = `${prefix}emails`
  const now = new Date().toISOString()
  const allowedCols = new Set(['subject', 'body_html', 'body_json'])
  const entries = (Object.entries(data) as [string, unknown][]).filter(([col]) => allowedCols.has(col))
  if (entries.length === 0) return

  const setClauses = entries.map(([col]) => `${col} = ?`).join(', ')
  const values = entries.map(([, val]) => val)

  await db
    .prepare(`UPDATE ${table} SET ${setClauses}, updated_at = ? WHERE id = ? AND user_id = ? AND status IN ('draft', 'scheduled')`)
    .bind(...values, now, id, userId)
    .run()
}

export async function replaceRecipients(
  db: D1Database,
  prefix: string,
  emailId: string,
  recipients: { contact_id?: string; name: string; email: string }[]
): Promise<void> {
  const table = `${prefix}email_recipients`
  await db.prepare(`DELETE FROM ${table} WHERE email_id = ?`).bind(emailId).run()
  for (const r of recipients) {
    const rid = crypto.randomUUID()
    await db
      .prepare(`INSERT INTO ${table} (id, email_id, contact_id, name, email) VALUES (?, ?, ?, ?, ?)`)
      .bind(rid, emailId, r.contact_id ?? null, r.name, r.email)
      .run()
  }
}

export async function deleteEmail(
  db: D1Database,
  prefix: string,
  userId: string,
  id: string
): Promise<void> {
  const table = `${prefix}emails`
  await db
    .prepare(`DELETE FROM ${table} WHERE id = ? AND user_id = ? AND status IN ('draft', 'scheduled')`)
    .bind(id, userId)
    .run()
}

export async function scheduleEmail(
  db: D1Database,
  prefix: string,
  userId: string,
  id: string,
  scheduledAt: string
): Promise<boolean> {
  const table = `${prefix}emails`
  const now = new Date().toISOString()
  const result = await db
    .prepare(`UPDATE ${table} SET status = 'scheduled', scheduled_at = ?, updated_at = ? WHERE id = ? AND user_id = ? AND status IN ('draft', 'scheduled')`)
    .bind(scheduledAt, now, id, userId)
    .run()
  return result.meta.changes > 0
}

export async function cancelEmailSchedule(
  db: D1Database,
  prefix: string,
  userId: string,
  id: string
): Promise<boolean> {
  const table = `${prefix}emails`
  const now = new Date().toISOString()
  const result = await db
    .prepare(`UPDATE ${table} SET status = 'draft', scheduled_at = NULL, updated_at = ? WHERE id = ? AND user_id = ? AND status = 'scheduled'`)
    .bind(now, id, userId)
    .run()
  return result.meta.changes > 0
}

export async function updateEmailStatus(
  db: D1Database,
  prefix: string,
  id: string,
  status: string,
  extra?: { sent_at?: string; error_message?: string }
): Promise<void> {
  const table = `${prefix}emails`
  const now = new Date().toISOString()
  if (extra?.sent_at) {
    await db
      .prepare(`UPDATE ${table} SET status = ?, sent_at = ?, updated_at = ? WHERE id = ?`)
      .bind(status, extra.sent_at, now, id)
      .run()
  } else if (extra?.error_message !== undefined) {
    await db
      .prepare(`UPDATE ${table} SET status = ?, error_message = ?, updated_at = ? WHERE id = ?`)
      .bind(status, extra.error_message, now, id)
      .run()
  } else {
    await db
      .prepare(`UPDATE ${table} SET status = ?, updated_at = ? WHERE id = ?`)
      .bind(status, now, id)
      .run()
  }
}

export async function findScheduledEmails(
  db: D1Database,
  prefix: string
): Promise<Email[]> {
  const table = `${prefix}emails`
  const now = new Date().toISOString()
  return db
    .prepare(`SELECT * FROM ${table} WHERE status = 'scheduled' AND scheduled_at <= ?`)
    .bind(now)
    .all<Email>()
    .then(r => r.results)
}
