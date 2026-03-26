import { Resend } from 'resend'

interface SendEmailParams {
  to: string
  subject: string
  htmlBody: string
  textBody?: string
  fromName?: string
  replyTo?: string
}

interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return new Resend(apiKey)
}

function getFromAddress(fromName?: string): string {
  const domain = process.env.RESEND_FROM_DOMAIN ?? 'replyengine.com'
  const name = fromName ?? 'ReplyEngine'
  return `${name} <noreply@${domain}>`
}

/**
 * Sends a recovery email via Resend.
 * Never throws — always returns a result object.
 */
export async function sendRecoveryEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    const resend = getResendClient()
    const from = getFromAddress(params.fromName)

    const { data, error } = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.htmlBody,
      text: params.textBody,
      replyTo: params.replyTo,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email'
    console.error('Email send error:', message)
    return { success: false, error: message }
  }
}
