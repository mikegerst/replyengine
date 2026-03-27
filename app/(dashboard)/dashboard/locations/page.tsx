'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface LocationData {
  id: string
  name: string
  business_type: string | null
  plan: string
  parent_business_id: string | null
  location_label: string | null
  google_place_id: string | null
  reviewCount: number
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formLabel, setFormLabel] = useState('')
  const [formParent, setFormParent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [editLabelValue, setEditLabelValue] = useState('')

  useEffect(() => {
    fetchLocations()
  }, [])

  async function fetchLocations() {
    setLoading(true)
    try {
      const res = await fetch('/api/businesses/locations')
      const json = await res.json()
      setLocations(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  const parents = locations.filter((l) => !l.parent_business_id)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim() || !formParent) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/businesses/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_business_id: formParent,
          name: formName.trim(),
          location_label: formLabel.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to create location')
        return
      }
      setShowForm(false)
      setFormName('')
      setFormLabel('')
      await fetchLocations()
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateLabel(id: string) {
    const res = await fetch(`/api/businesses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location_label: editLabelValue.trim() || null }),
    })
    if (res.ok) {
      setEditingLabel(null)
      await fetchLocations()
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will remove all associated reviews, disputes, and outreach records. This action cannot be undone.`)) {
      return
    }
    await fetch(`/api/businesses/${id}`, { method: 'DELETE' })
    await fetchLocations()
  }

  if (loading) {
    return (
      <div>
        <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your business locations.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Location'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Add location form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 p-5 mb-6 space-y-4">
          <div>
            <label htmlFor="locParent" className="block text-sm font-medium text-gray-700 mb-1">
              Parent business
            </label>
            <select
              id="locParent"
              value={formParent}
              onChange={(e) => setFormParent(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="">Select parent</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="locName" className="block text-sm font-medium text-gray-700 mb-1">
                Location name
              </label>
              <input
                id="locName"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                placeholder="e.g. Mike's Pizza — Downtown"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="locLabel" className="block text-sm font-medium text-gray-700 mb-1">
                Label <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="locLabel"
                type="text"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="e.g. Downtown, Westside"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create Location'}
          </Button>
        </form>
      )}

      {/* Location list */}
      {locations.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">No locations yet. Create your first business from onboarding.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => (
            <div key={loc.id} className={`bg-white rounded-lg border border-gray-200 p-4 ${loc.parent_business_id ? 'ml-6 border-l-4 border-l-gray-300' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{loc.name}</h3>
                    {editingLabel === loc.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editLabelValue}
                          onChange={(e) => setEditLabelValue(e.target.value)}
                          className="px-2 py-0.5 border border-gray-300 rounded text-xs w-24 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          placeholder="Label"
                        />
                        <button onClick={() => handleUpdateLabel(loc.id)} className="text-xs text-blue-600 hover:text-blue-800">Save</button>
                        <button onClick={() => setEditingLabel(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                      </div>
                    ) : (
                      <>
                        {loc.location_label && (
                          <span className="text-xs text-gray-400">({loc.location_label})</span>
                        )}
                        <button
                          onClick={() => { setEditingLabel(loc.id); setEditLabelValue(loc.location_label ?? '') }}
                          className="text-xs text-gray-300 hover:text-gray-500"
                        >
                          {loc.location_label ? 'edit' : '+ label'}
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {loc.business_type && (
                      <span className="text-xs text-gray-400">{loc.business_type}</span>
                    )}
                    <span className="text-xs text-gray-500">{loc.reviewCount} review{loc.reviewCount !== 1 ? 's' : ''}</span>
                    {loc.google_place_id ? (
                      <span className="inline-flex items-center text-xs text-green-600">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs text-gray-400">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-1" />
                        Not connected
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!loc.google_place_id && (
                    <Button size="sm" variant="secondary">Connect Google</Button>
                  )}
                  {loc.parent_business_id && (
                    <button
                      onClick={() => handleDelete(loc.id, loc.name)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
