import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

// Set ENCRYPTION_KEY before importing the module
const TEST_KEY = 'a'.repeat(64) // 64 hex chars = 32 bytes
const WRONG_KEY = 'b'.repeat(64)

beforeAll(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY
})

afterAll(() => {
  delete process.env.ENCRYPTION_KEY
})

import { encrypt, decrypt, isEncrypted } from '@/lib/utils/encryption'

describe('encryption', () => {
  describe('encrypt and decrypt round-trip', () => {
    it('round-trips correctly for normal text', () => {
      const plaintext = 'my-secret-google-token'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe(plaintext)
    })

    it('round-trips correctly for empty string', () => {
      const plaintext = ''
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe(plaintext)
    })

    it('round-trips correctly for unicode text', () => {
      const plaintext = 'café résumé 日本語'
      const encrypted = encrypt(plaintext)
      const decrypted = decrypt(encrypted)
      expect(decrypted).toBe(plaintext)
    })
  })

  describe('encrypted format', () => {
    it('outputs format "iv:authTag:ciphertext" with 3 colon-separated parts', () => {
      const encrypted = encrypt('test-data')
      const parts = encrypted.split(':')
      expect(parts).toHaveLength(3)
    })

    it('all parts are valid base64', () => {
      const encrypted = encrypt('test-data')
      const parts = encrypted.split(':')
      for (const part of parts) {
        const decoded = Buffer.from(part, 'base64')
        expect(decoded.toString('base64')).toBe(part)
      }
    })
  })

  describe('random IV', () => {
    it('encrypting the same plaintext twice produces different ciphertexts', () => {
      const plaintext = 'same-data'
      const encrypted1 = encrypt(plaintext)
      const encrypted2 = encrypt(plaintext)
      expect(encrypted1).not.toBe(encrypted2)
    })
  })

  describe('isEncrypted', () => {
    it('returns true for encrypted strings', () => {
      const encrypted = encrypt('test-value')
      expect(isEncrypted(encrypted)).toBe(true)
    })

    it('returns false for plaintext strings', () => {
      expect(isEncrypted('just-a-regular-string')).toBe(false)
    })

    it('returns false for strings with wrong number of colons', () => {
      expect(isEncrypted('part1:part2')).toBe(false)
      expect(isEncrypted('part1:part2:part3:part4')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isEncrypted('')).toBe(false)
    })
  })

  describe('decrypt failure handling', () => {
    it('returns empty string when decrypting with wrong key', () => {
      const encrypted = encrypt('secret-data')

      // Swap key
      process.env.ENCRYPTION_KEY = WRONG_KEY
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = decrypt(encrypted)
      expect(result).toBe('')
      consoleSpy.mockRestore()

      // Restore correct key
      process.env.ENCRYPTION_KEY = TEST_KEY
    })

    it('returns empty string for corrupted ciphertext', () => {
      const encrypted = encrypt('secret-data')
      const parts = encrypted.split(':')
      parts[2] = 'corrupted-data-here'
      const corrupted = parts.join(':')

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = decrypt(corrupted)
      expect(result).toBe('')
      consoleSpy.mockRestore()
    })

    it('returns empty string for invalid format', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = decrypt('not-encrypted-at-all')
      expect(result).toBe('')
      consoleSpy.mockRestore()
    })
  })
})
