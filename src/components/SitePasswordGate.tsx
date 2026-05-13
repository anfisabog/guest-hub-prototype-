import { useCallback, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Button, Input } from '@/components/ui'

const STORAGE_KEY = 'channel_manager_site_unlocked_v1'

function isPasswordConfigured(): boolean {
  const p = import.meta.env.VITE_SITE_PASSWORD
  return typeof p === 'string' && p.trim().length > 0
}

function readStoredUnlock(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * When `VITE_SITE_PASSWORD` is set at build time, visitors must enter it once per browser session.
 * Suitable for casual preview protection only (secret is in the client bundle).
 */
export function SitePasswordGate({ children }: { children: ReactNode }) {
  const required = useMemo(() => import.meta.env.VITE_SITE_PASSWORD?.trim() ?? '', [])
  const [unlocked, setUnlocked] = useState(() => !isPasswordConfigured() || readStoredUnlock())
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      if (value.trim() === required) {
        try {
          sessionStorage.setItem(STORAGE_KEY, '1')
        } catch {
          /* ignore */
        }
        setError(false)
        setUnlocked(true)
      } else {
        setError(true)
      }
    },
    [required, value],
  )

  if (unlocked) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2f4f7] p-4">
      <div className="w-full max-w-[400px] rounded-xl border border-[#e9eaeb] bg-white p-6 shadow-[0px_12px_32px_-8px_rgba(10,13,18,0.12)]">
        <h1 className="text-lg font-semibold leading-7 text-[#101828]">Channel Manager</h1>
        <p className="mt-1 text-sm leading-5 text-[#667085]">This preview is password protected.</p>
        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError(false)
            }}
            className={error ? 'border-[#f04438] ring-1 ring-[#f04438]/20' : ''}
            aria-invalid={error}
            aria-describedby={error ? 'gate-err' : undefined}
          />
          {error ? (
            <p id="gate-err" className="text-sm text-[#b42318]">
              Incorrect password. Try again.
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </div>
    </div>
  )
}
