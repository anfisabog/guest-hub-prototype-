import { createContext, useContext, type ReactNode } from 'react'
import { useChannelManager } from '@/hooks/useChannelManager'

type ChannelManagerContextValue = ReturnType<typeof useChannelManager>

const ChannelManagerContext = createContext<ChannelManagerContextValue | null>(null)

export function ChannelManagerProvider({ children }: { children: ReactNode }) {
  const value = useChannelManager()
  return (
    <ChannelManagerContext.Provider value={value}>
      {children}
    </ChannelManagerContext.Provider>
  )
}

export function useChannelManagerContext() {
  const ctx = useContext(ChannelManagerContext)
  if (!ctx) throw new Error('useChannelManagerContext must be used within ChannelManagerProvider')
  return ctx
}
