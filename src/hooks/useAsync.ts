import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage, REMOTE_API } from '@/services/http'
import { DB_STORAGE_KEY } from '@/services/mockApi'

interface State<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Runs an async loader whenever `deps` change and ignores results of outdated calls.
 * With `live` (default) it also refreshes silently when the shared database is changed
 * from another browser tab, so a booking made in one window shows up in the other one.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[], live = true) {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null })
  const callId = useRef(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const run = useCallback((quiet = false) => {
    const id = ++callId.current
    if (!quiet) setState((s) => ({ ...s, loading: true, error: null }))
    loaderRef
      .current()
      .then((data) => id === callId.current && setState({ data, loading: false, error: null }))
      .catch((e) => {
        if (quiet || id !== callId.current) return
        setState({ data: null, loading: false, error: errorMessage(e) })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
  }, [run])

  useEffect(() => {
    if (!live) return
    const onStorage = (e: StorageEvent) => {
      if (e.key === DB_STORAGE_KEY) run(true)
    }
    window.addEventListener('storage', onStorage)
    // with a real server other people change the data: refresh quietly every 15 s and when the tab gets the focus back
    const tick = () => document.visibilityState === 'visible' && run(true)
    const timer = REMOTE_API ? window.setInterval(tick, 15000) : undefined
    if (REMOTE_API) window.addEventListener('focus', tick)
    return () => {
      window.removeEventListener('storage', onStorage)
      if (timer) window.clearInterval(timer)
      if (REMOTE_API) window.removeEventListener('focus', tick)
    }
  }, [live, run])

  return { ...state, reload: () => run() }
}
