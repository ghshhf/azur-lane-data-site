import { useEffect } from 'react'

const SITE_NAME = '碧蓝航线数据查询站'

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME
  }, [title])
}
