import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange, placeholder = '搜索...' }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-al-text-dim" />
      <input
        type="text"
        className="al-input w-full pl-10 pr-10"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-al-text-dim hover:text-al-text cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
