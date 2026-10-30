import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { tr } from '@/i18n'

interface Props {
  children: ReactNode
  /** when this value changes (e.g. the route), the boundary tries to show the page again */
  resetKey?: string
}
interface State {
  error: Error | null
}

/**
 * Protects against the "white screen": an unexpected error in one page shows a friendly
 * message with a way out instead of an empty browser window.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected UI error:', error, info.componentStack)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="mx-auto my-16 max-w-lg rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-tint text-danger" aria-hidden>
          <TriangleAlert size={28} />
        </span>
        <h1 className="mt-4 text-2xl font-bold">{tr("მოხდა შეცდომა")}</h1>
        <p className="mt-2 text-muted">{tr("გვერდის ჩატვირთვისას მოულოდნელი შეცდომა მოხდა. თქვენი მონაცემები არ დაკარგულა.")}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            <RefreshCw size={16} aria-hidden />{' '}{tr("გვერდის განახლება")}</button>
          <a href="/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-5 text-sm font-medium transition-colors hover:border-brand hover:text-brand-dark">{tr("მთავარ გვერდზე")}</a>
        </div>
      </div>
    )
  }
}
