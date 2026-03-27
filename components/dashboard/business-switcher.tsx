'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSelectedBusinessId, setSelectedBusinessId } from '@/lib/utils/selected-business'
import Link from 'next/link'

interface BusinessOption {
  id: string
  name: string
  business_type: string | null
  parent_business_id: string | null
  location_label: string | null
  reviewCount?: number
}

export function BusinessSwitcher() {
  const [businesses, setBusinesses] = useState<BusinessOption[]>([])
  const [selected, setSelected] = useState<string>('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('businesses')
        .select('id, name, business_type, parent_business_id, location_label')
        .order('parent_business_id', { ascending: true, nullsFirst: true })
        .order('name', { ascending: true })

      if (data && data.length > 0) {
        setBusinesses(data)

        const storedId = getSelectedBusinessId()
        const valid = data.find((b) => b.id === storedId)
        const activeId = valid ? valid.id : (storedId === 'all' ? 'all' : data[0].id)
        setSelected(activeId)
        if (activeId !== 'all') {
          setSelectedBusinessId(activeId)
        }
      }
    }
    load()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(id: string) {
    setSelected(id)
    setSelectedBusinessId(id)
    setOpen(false)
    window.location.reload()
  }

  if (businesses.length === 0) return null

  // Group businesses: parents first, then children under parents
  const parents = businesses.filter((b) => !b.parent_business_id)
  const children = businesses.filter((b) => b.parent_business_id)
  const childrenByParent = new Map<string, BusinessOption[]>()
  for (const c of children) {
    const list = childrenByParent.get(c.parent_business_id!) ?? []
    list.push(c)
    childrenByParent.set(c.parent_business_id!, list)
  }

  const selectedBiz = businesses.find((b) => b.id === selected)
  const displayName = selected === 'all'
    ? 'All Locations'
    : selectedBiz
      ? `${selectedBiz.name}${selectedBiz.location_label ? ` (${selectedBiz.location_label})` : ''}`
      : 'Select business'

  return (
    <div className="px-3 pb-3 relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-2.5 py-2 border border-gray-200 rounded-md text-sm bg-white text-gray-900 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="truncate">{displayName}</span>
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-3 right-3 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* All Locations option */}
          {businesses.length > 1 && (
            <button
              onClick={() => handleSelect('all')}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                selected === 'all' ? 'bg-gray-50 font-medium' : 'text-gray-700'
              }`}
            >
              All Locations
            </button>
          )}

          {/* Grouped locations */}
          {parents.map((parent) => {
            const subs = childrenByParent.get(parent.id) ?? []
            return (
              <div key={parent.id}>
                <button
                  onClick={() => handleSelect(parent.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    selected === parent.id ? 'bg-gray-50 font-medium' : 'text-gray-900'
                  }`}
                >
                  {parent.name}
                  {parent.location_label && (
                    <span className="text-gray-400 ml-1">({parent.location_label})</span>
                  )}
                </button>
                {subs.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSelect(sub.id)}
                    className={`w-full text-left pl-7 pr-3 py-1.5 text-sm hover:bg-gray-50 transition-colors ${
                      selected === sub.id ? 'bg-gray-50 font-medium' : 'text-gray-600'
                    }`}
                  >
                    {sub.name}
                    {sub.location_label && (
                      <span className="text-gray-400 ml-1">({sub.location_label})</span>
                    )}
                  </button>
                ))}
              </div>
            )
          })}

          {/* Standalone businesses without a parent (that aren't parents themselves) */}
          {businesses.filter((b) => !b.parent_business_id && !childrenByParent.has(b.id) && parents.filter((p) => childrenByParent.has(p.id)).length > 0).map((biz) => (
            <button
              key={biz.id}
              onClick={() => handleSelect(biz.id)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                selected === biz.id ? 'bg-gray-50 font-medium' : 'text-gray-900'
              }`}
            >
              {biz.name}
            </button>
          ))}

          {/* Manage Locations link */}
          <Link
            href="/dashboard/locations"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100"
          >
            Manage Locations
          </Link>
        </div>
      )}
    </div>
  )
}
