import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

/** Fallback mode: the app keeps working with the data stored on this device and tells the user why things may look old. */
export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 bg-ink px-4 py-3 text-sm text-white">
      <WifiOff size={16} aria-hidden />
      ინტერნეტ-კავშირი არ არის. ნაჩვენებია ამ მოწყობილობაზე შენახული მონაცემები, კავშირის აღდგენისას ყველაფერი განახლდება.
    </div>
  )
}
