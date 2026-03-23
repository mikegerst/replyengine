'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSelectedBusinessId, setSelectedBusinessId } from '@/lib/utils/selected-business'

interface BusinessOption {
  id: string
  name: string
  business_type: string | null
}

export function BusinessSwitcher() {
  const [businesses, setBusinesses] = useState<BusinessOption[]>([])
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('businesses')
        .select('id, name, business_type')
        .order('created_at', { ascending: true })

      if (data && data.length > 0) {
        setBusinesses(data)

        const storedId = getSelectedBusinessId()
        const valid = data.find((b) => b.id === storedId)
        const activeId = valid ? valid.id : data[0].id
        setSelected(activeId)
        setSelectedBusinessId(activeId)
      }
    }
    load()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newId = e.target.value
    setSelected(newId)
    setSelectedBusinessId(newId)
    window.location.reload()
  }

  if (businesses.length <= 1) return null

  return (
    <div className="px-3 pb-3">
      <select
        value={selected}
        onChange={handleChange}
        className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent truncate"
      >
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}{b.business_type ? ` — ${b.business_type}` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
