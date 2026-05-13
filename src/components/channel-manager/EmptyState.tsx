import { Button } from '@/components/ui'
import { FadeIn } from '@/lib/motion'

export interface EmptyStateProps {
  onConnectAccount: () => void
}

export function EmptyState({ onConnectAccount }: EmptyStateProps) {
  return (
    <div className="flex w-full flex-1 min-h-0 items-center justify-center px-6 py-8">
      <FadeIn scaleFrom={0.98} duration="normal">
      <div className="flex max-w-[360px] flex-col items-center text-center">
        <div className="relative w-[292px] h-[292px] flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[#f2f4f7]" />
          <div className="absolute inset-[22px] rounded-full border border-[#f2f4f7]" />
          <div className="absolute inset-[44px] rounded-full border border-[#f2f4f7]" />
          <div className="absolute inset-[66px] rounded-full border border-[#f2f4f7]" />
          <div className="absolute inset-[88px] rounded-full border border-[#f2f4f7]" />
          <div className="absolute inset-[110px] rounded-full border border-[#f2f4f7]" />
          <div className="w-12 h-12 rounded-xl border border-[#d5d7da] bg-white flex items-center justify-center shadow-[0px_1px_2px_rgba(10,13,18,0.05)]">
            <svg className="w-5 h-5 text-[#667085]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 007.07 0l1.4-1.4a5 5 0 10-7.07-7.07L10 6" />
              <path d="M14 11a5 5 0 00-7.07 0l-1.4 1.4a5 5 0 007.07 7.07L14 18" />
            </svg>
          </div>
        </div>
        <h2 className="mt-2 text-[16px] leading-6 font-semibold text-[#181d27]">Connect your first account</h2>
        <p className="mt-2 text-[14px] leading-5 text-[#535862]">
          This text explains the value of channel connection.
        </p>
        <Button
          type="button"
          variant="primary"
          onClick={onConnectAccount}
          className="mt-4 gap-1.5 active:scale-[0.98]"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4.93" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L13 19.07" />
          </svg>
          Connect account
        </Button>
      </div>
      </FadeIn>
    </div>
  )
}
