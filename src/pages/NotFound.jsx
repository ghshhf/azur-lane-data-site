import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { useDocumentTitle } from '../utils/useDocumentTitle.js'

export default function NotFound() {
  useDocumentTitle('页面不存在')
  return (
    <div className="al-panel p-8 text-center">
      <Compass className="w-10 h-10 text-al-gold mx-auto mb-3" />
      <h1 className="text-xl font-bold text-al-text mb-2">页面不存在</h1>
      <p className="text-sm text-al-text-muted mb-4">链接可能已失效，或数据条目已被移除。</p>
      <Link to="/" className="al-btn-gold inline-block">返回首页</Link>
    </div>
  )
}
