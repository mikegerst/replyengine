import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const SEPARATOR = ':'

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  if (keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)')
  }
  return Buffer.from(keyHex, 'hex')
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns a string in the format "iv:authTag:ciphertext" (all base64-encoded).
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  const ivB64 = iv.toString('base64')
  const authTagB64 = authTag.toString('base64')
  const ciphertextB64 = encrypted.toString('base64')

  return `${ivB64}${SEPARATOR}${authTagB64}${SEPARATOR}${ciphertextB64}`
}

/**
 * Decrypts a string produced by encrypt().
 * If decryption fails, logs a warning and returns an empty string.
 */
export function decrypt(encryptedValue: string): string {
  try {
    const key = getEncryptionKey()
    const parts = encryptedValue.split(SEPARATOR)

    if (parts.length !== 3) {
      console.warn('Decryption failed: invalid encrypted format')
      return ''
    }

    const [ivB64, authTagB64, ciphertextB64] = parts
    const iv = Buffer.from(ivB64, 'base64')
    const authTag = Buffer.from(authTagB64, 'base64')
    const ciphertext = Buffer.from(ciphertextB64, 'base64')

    if (iv.length !== IV_LENGTH) {
      console.warn('Decryption failed: invalid IV length')
      return ''
    }

    if (authTag.length !== AUTH_TAG_LENGTH) {
      console.warn('Decryption failed: invalid auth tag length')
      return ''
    }

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ])

    return decrypted.toString('utf8')
  } catch (error) {
    console.warn('Decryption failed:', error instanceof Error ? error.message : 'Unknown error')
    return ''
  }
}

/**
 * Checks whether a value matches the encrypted format (iv:authTag:ciphertext, all base64).
 * Used to distinguish already-encrypted values from plaintext during migration.
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(SEPARATOR)
  if (parts.length !== 3) return false

  const [ivB64, authTagB64, ciphertextB64] = parts

  try {
    const iv = Buffer.from(ivB64, 'base64')
    const authTag = Buffer.from(authTagB64, 'base64')
    const ciphertext = Buffer.from(ciphertextB64, 'base64')

    // Validate expected sizes
    if (iv.length !== IV_LENGTH) return false
    if (authTag.length !== AUTH_TAG_LENGTH) return false
    if (ciphertext.length === 0) return false

    // Verify the base64 round-trips cleanly (not arbitrary text with colons)
    if (iv.toString('base64') !== ivB64) return false
    if (authTag.toString('base64') !== authTagB64) return false
    if (ciphertext.toString('base64') !== ciphertextB64) return false

    return true
  } catch {
    return false
  }
}
