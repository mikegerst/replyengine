'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const GOOGLE_REVIEWS_URL = 'https://business.google.com/reviews'

interface DisputeFileButtonProps {
  textToCopy: string
  label: string
  onConfirm: () => void
  onTrouble?: () => void
  confirmPrompt: string
  className?: string
}

export function DisputeFileButton({
  textToCopy,
  label,
  onConfirm,
  onTrouble,
  confirmPrompt,
  className = '',
}: DisputeFileButtonProps) {
  const [phase, setPhase] = useState<'idle' | 'toast' | 'confirm'>('idle')
  const [toastVisible, setToastVisible] = useState(false)

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  }

  async function handleClick() {
    await copyToClipboard(textToCopy)
    window.open(GOOGLE_REVIEWS_URL, '_blank')
    setPhase('toast')
    setToastVisible(true)
  }

  // Listen for tab return via visibilitychange
  const handleVisibility = useCallback(() => {
    if (document.visibilityState === 'visible' && phase === 'toast') {
      setPhase('confirm')
    }
  }, [phase])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [handleVisibility])

  // Also show confirm after 5 seconds as fallback
  useEffect(() => {
    if (phase === 'toast') {
      const timer = setTimeout(() => setPhase('confirm'), 5000)
      return () => clearTimeout(timer)
    }
  }, [phase])

  // Auto-hide toast
  useEffect(() => {
    if (toastVisible) {
      const timer = setTimeout(() => setToastVisible(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [toastVisible])

  if (phase === 'confirm') {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-900">{confirmPrompt}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => { onConfirm(); setPhase('idle') }}>
            Yes, I submitted it
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setPhase('idle')}>
            Not yet — I&apos;ll do it later
          </Button>
          {onTrouble && (
            <Button size="sm" variant="ghost" onClick={() => { onTrouble(); setPhase('idle') }}>
              I had trouble
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <Button className="w-full sm:w-auto" onClick={handleClick}>
        {label}
      </Button>
      <p className="text-[11px] text-gray-400 mt-1.5">
        Opens Google&apos;s tool and copies your text to clipboard
      </p>

      {/* Toast */}
      {toastVisible && (
        <div className="mt-3 bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm text-green-800 animate-in">
          Dispute text copied! Paste it in Google&apos;s form when prompted.
        </div>
      )}
    </div>
  )
}
