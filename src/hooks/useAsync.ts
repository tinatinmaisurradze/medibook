import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from '@/services/http'

interface State<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/** Runs an async loader whenever `deps` change; ignores results of outdated calls. */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null })
  const callId = useRef(0)

  const run = useCallback(() => {
    const id = ++callId.current
    setState((s) => ({ ...s, loading: true, error: null }))
    loader()
      .then((data) => id === callId.current && setState({ data, loading: false, error: null }))
      .catch((e) => id === callId.current && setState({ data: null, loading: false, error: errorMessage(e) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
  }, [run])

  return { ...state, reload: run }
}
