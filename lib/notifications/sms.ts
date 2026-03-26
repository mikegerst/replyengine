import twilio from 'twilio'

interface SendSmsParams {
  to: string
  body: string
  from?: string
}

interface SendSmsResult {
  success: boolean
  sid?: string
  error?: string
}

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set')
  }

  return twilio(accountSid, authToken)
}

/**
 * Sends a recovery SMS via Twilio.
 * Never throws — always returns a result object.
 */
export async function sendRecoverySms(params: SendSmsParams): Promise<SendSmsResult> {
  try {
    const client = getTwilioClient()
    const fromNumber = params.from ?? process.env.TWILIO_PHONE_NUMBER

    if (!fromNumber) {
      return { success: false, error: 'TWILIO_PHONE_NUMBER is not configured' }
    }

    const message = await client.messages.create({
      to: params.to,
      from: fromNumber,
      body: params.body,
    })

    return { success: true, sid: message.sid }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send SMS'
    console.error('SMS send error:', message)
    return { success: false, error: message }
  }
}
