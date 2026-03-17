import { useEffect, useState, useCallback } from 'react'

export function useChatScroll<T>(dep: T) {
  const [node, setNode] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (node) {
      node.scrollTop = node.scrollHeight
    }
  }, [dep, node])

  const ref = useCallback((element: HTMLDivElement | null) => {
    setNode(element)
  }, [])

  return ref
}
