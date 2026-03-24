'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSelectedBusinessId } from '@/lib/utils/selected-business'
import { Button } from '@/components/ui/button'

const TIMING_TIPS: Record<string, string> = {
  Restaurant: 'Best time to ask: when presenting the check or in a follow-up text 2 hours after dining.',
  'Dental / Medical': 'Best time to ask: at checkout after a successful appointment.',
  'Home Services': 'Best time to ask: immediately after job completion when satisfaction is highest.',
  Salon: 'Best time to ask: right after the client sees their new look in the mirror.',
  Automotive: 'Best time to ask: when handing back the keys after a repair.',
  'Hotel / Lodging': 'Best time to ask: at checkout or in a follow-up email the next day.',
}

export default function GrowPage() {
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [placeId, setPlaceId] = useState('')
  const [placeIdInput, setPlaceIdInput] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const selectedId = getSelectedBusinessId()

      let query = supabase.from('businesses').select('name, business_type, google_place_id')
      if (selectedId) query = query.eq('id', selectedId)

      const { data } = await query.limit(1).single()
      if (data) {
        setBusinessName(data.name ?? '')
        setBusinessType(data.business_type ?? '')
        if (data.google_place_id) {
          setPlaceId(data.google_place_id)
          setPlaceIdInput(data.google_place_id)
        }
      }
    }
    load()
  }, [])

  const reviewLink = placeId
    ? `https://search.google.com/local/writereview?placeid=${placeId}`
    : ''

  function copy(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const ownerName = businessName.split(/[''\u2019]s?\s/)[0] ?? 'Owner'

  const templates = [
    {
      id: 'inperson',
      label: 'After a positive visit',
      text: `Hi [Customer], thanks for visiting ${businessName} today! If you enjoyed your experience, we'd really appreciate a quick Google review — it helps others find us. Here's the direct link: ${reviewLink || '[your review link]'}. Thanks! — ${ownerName}`,
    },
    {
      id: 'service',
      label: 'After service completion',
      text: `Hi [Customer], hope everything is going well! If you have a moment, a Google review would mean a lot to our small team: ${reviewLink || '[your review link]'}. Thanks for choosing ${businessName}! — ${ownerName}`,
    },
    {
      id: 'email',
      label: 'For email/newsletter',
      text: `Your feedback helps us grow! If you've had a great experience at ${businessName}, please consider leaving us a Google review: ${reviewLink || '[your review link]'}. Every review helps others find us.`,
    },
  ]

  const timingTip = TIMING_TIPS[businessType] ?? 'Ask within 24 hours of a positive experience while the memory is fresh.'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Grow</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate more 5-star reviews proactively.
        </p>
      </div>

      {/* Section 1: Review Link Generator */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Direct Review Link</h2>

        {!placeId ? (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              Enter your Google Place ID to generate a direct review link.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={placeIdInput}
                onChange={(e) => setPlaceIdInput(e.target.value)}
                placeholder="e.g. ChIJ..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <Button size="sm" onClick={() => setPlaceId(placeIdInput)}>
                Generate
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Find your Place ID at Google&apos;s Place ID Finder tool or connect your Google Business Profile.
            </p>
          </div>
        ) : (
          <div>
            <div className="bg-gray-50 rounded-md p-3 mb-3">
              <p className="text-sm text-gray-700 font-mono break-all">{reviewLink}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => copy(reviewLink, 'link')}
              >
                {copied === 'link' ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPlaceId('')}
              >
                Change Place ID
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Review Request Templates */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Request Templates</h2>
        <div className="space-y-4">
          {templates.map((t) => (
            <div key={t.id} className="border border-gray-100 rounded-md p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">{t.label}</p>
              <textarea
                defaultValue={t.text}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y mb-2"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const el = document.querySelector(`textarea`) as HTMLTextAreaElement | null
                  copy(el?.value ?? t.text, t.id)
                }}
              >
                {copied === t.id ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Request Tracker */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Review Request Tracker</h2>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-3xl font-bold text-gray-900">{requestCount}</p>
            <p className="text-xs text-gray-500">Requests sent this month</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setRequestCount((c) => c + 1)}
          >
            + Log a request
          </Button>
        </div>
      </div>

      {/* Section 4: Smart Timing */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Smart Timing</h2>
        <div className="bg-blue-50 rounded-md p-4 border border-blue-100">
          <p className="text-sm text-blue-800">{timingTip}</p>
        </div>
      </div>
    </div>
  )
}
