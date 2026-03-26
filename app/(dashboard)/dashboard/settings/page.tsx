'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSelectedBusinessId } from '@/lib/utils/selected-business'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [employeeNames, setEmployeeNames] = useState('')
  const [competitorNames, setCompetitorNames] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [businessDoesNotHave, setBusinessDoesNotHave] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const selectedId = getSelectedBusinessId()

      let query = supabase.from('businesses').select('id, employee_names, competitor_names, business_description, business_does_not_have')
      if (selectedId) query = query.eq('id', selectedId)

      const { data } = await query.limit(1).single()
      if (data) {
        setBusinessId(data.id)
        setEmployeeNames((data.employee_names ?? []).join('\n'))
        setCompetitorNames((data.competitor_names ?? []).join('\n'))
        setBusinessDescription(data.business_description ?? '')
        setBusinessDoesNotHave(data.business_does_not_have ?? '')
      }
    }
    load()
  }, [])

  async function handleSave() {
    if (!businessId) return
    setSaving(true)
    setError(null)
    setSaved(false)

    const employees = employeeNames
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean)

    const competitors = competitorNames
      .split('\n')
      .map((n) => n.trim())
      .filter(Boolean)

    const res = await fetch(`/api/businesses/${businessId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_names: employees,
        competitor_names: competitors,
        business_description: businessDescription || null,
        business_does_not_have: businessDoesNotHave || null,
      }),
    })

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const json = await res.json()
      setError(json.error ?? 'Failed to save')
    }

    setSaving(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-2 text-sm text-gray-500">Business and notification preferences.</p>

      {/* Business Details — for wrong-business detection */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Business Details
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Help us detect reviews that might be for the wrong business.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Describe your business <span className="text-gray-400 font-normal">(what you offer, your physical space)</span>
            </label>
            <textarea
              id="description"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              rows={3}
              placeholder="Indoor restaurant, wood-fired pizza, full bar, family-friendly"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
            />
          </div>

          <div>
            <label htmlFor="doesNotHave" className="block text-sm font-medium text-gray-700 mb-1">
              What do you NOT have that people sometimes confuse?
            </label>
            <textarea
              id="doesNotHave"
              value={businessDoesNotHave}
              onChange={(e) => setBusinessDoesNotHave(e.target.value)}
              rows={3}
              placeholder="No creek view, no outdoor patio, no live music, no delivery"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">
              If a reviewer mentions features listed here, we&apos;ll flag the review as potentially for the wrong business.
            </p>
          </div>
        </div>
      </div>

      {/* Conflict of Interest Detection */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Conflict of Interest Detection
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          We&apos;ll automatically flag reviews from people who may have a conflict of interest &mdash;
          former employees, current staff, or competitors.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="employees" className="block text-sm font-medium text-gray-700 mb-1">
              Employee names <span className="text-gray-400 font-normal">(current and former, one per line)</span>
            </label>
            <textarea
              id="employees"
              value={employeeNames}
              onChange={(e) => setEmployeeNames(e.target.value)}
              rows={5}
              placeholder={"John Smith\nJane Doe\nMike Johnson"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">
              If a reviewer&apos;s name matches an employee, it will be automatically flagged as a conflict of interest.
            </p>
          </div>

          <div>
            <label htmlFor="competitors" className="block text-sm font-medium text-gray-700 mb-1">
              Known competitor businesses <span className="text-gray-400 font-normal">(one per line)</span>
            </label>
            <textarea
              id="competitors"
              value={competitorNames}
              onChange={(e) => setCompetitorNames(e.target.value)}
              rows={4}
              placeholder={"Rival Plumbing Co\nCompetitor HVAC Inc"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">
              Reviews from accounts matching competitor names will be flagged with medium confidence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving || !businessId}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            {saved && (
              <span className="text-sm text-green-600">Saved</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
