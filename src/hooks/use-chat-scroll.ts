import { useCallback,useEffect,useRef } from 'react'

export function useChatScroll<T>(dep: T) {
  const nodeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = nodeRef.current
    if (node) {
      node.scrollTop = node.scrollHeight
    }
  }, [dep])

  const ref = useCallback((element: HTMLDivElement | null) => {
    nodeRef.current = element
  }, [])

  return ref
}
