import { useNavigate } from 'react-router-dom'

// 详情页返回：直接打开分享链接时浏览器没有上一页，navigate(-1) 会把用户弹出站点。
// 无历史栈时回退到所属列表页。
export function useBackToList(fallbackPath) {
  const navigate = useNavigate()
  return () => {
    const idx = window.history.state?.idx
    if (typeof idx === 'number' && idx > 0) navigate(-1)
    else navigate(fallbackPath)
  }
}
