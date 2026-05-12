export interface User {
  id: string
  email: string
  role: 'admin' | 'user'
  email_verified: boolean
  is_active: boolean
  timezone: string
  language: string
  theme: 'light' | 'dark' | 'system'
  created_at: string
  twofa?: {
    totp_enabled: boolean
    passkey_enabled: boolean
    email_otp_enabled: boolean
    preferred_method: string | null
  }
}

export interface SystemSettings {
  email_verification_enabled: string
  require_2fa: string
  registration_enabled: string
  smtp_config: string
  resend_config: string
  email_provider: string
  app_name?: string
}

export interface Session {
  jti: string
  iat: number
  exp: number
  ip?: string
  ua?: string
  current: boolean
}

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
  recipients?: EmailRecipient[]
}

export interface EmailRecipient {
  id: string
  email_id: string
  contact_id: string | null
  name: string
  email: string
}

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
