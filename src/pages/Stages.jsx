import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import stages from '../data/stages.json'
import { Package, Users, ChevronRight } from 'lucide-react'

const difficultyColors = { '普通': 'text-r-r', '困难': 'text-r-elite', '极难': 'text-r-meta', 'SP': 'text-r-sr' }

export default function Stages() {
  const [chapterFilter, setChapterFilter] = useState([])
  const chapters = [...new Set(stages.map(s => s.chapter))].sort((a, b) => a - b)

  const filtered = useMemo(() => {
    if (chapterFilter.length === 0) return stages
    return stages.filter(s => chapterFilter.includes(s.chapter))
  }, [chapterFilter])

  const toggleChapter = (ch) => {
    setChapterFilter(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-al-text mb-4">关卡活动</h1>
      <div className="mb-4">
        <div className="al-panel p-4">
          <div className="text-xs text-al-text-muted mb-2 font-medium">章节筛选</div>
          <div className="flex flex-wrap gap-1.5">
            {chapters.map(ch => {
              const active = chapterFilter.includes(ch)
              return (
                <button key={ch} onClick={() => toggleChapter(ch)}
                  className={`px-2 py-1 rounded text-xs border transition-colors cursor-pointer ${active ? 'bg-al-gold text-al-bg border-al-gold' : 'bg-al-panel-light text-al-text-muted border-al-border hover:border-al-gold/50'}`}>
                  第{ch}章
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div className="text-sm text-al-text-muted mb-3">共 {filtered.length} / {stages.length} 个关卡</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(stage => (
          <Link key={stage.id} to={`/stages/${stage.id}`} className="al-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-al-text">{stage.name}</h3>
              <ChevronRight className="w-4 h-4 text-al-text-dim" />
            </div>
            <div className="flex items-center gap-3 text-xs text-al-text-muted mb-2">
              <span>第{stage.chapter}章</span>
              <span className={difficultyColors[stage.difficulty] || ''}>{stage.difficulty}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-al-text-muted">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {stage.drops?.ships?.length || 0} 舰娘</span>
              <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {stage.drops?.equipment?.length || 0} 装备</span>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-al-text-dim">没有找到匹配的关卡</div>}
    </div>
  )
}
