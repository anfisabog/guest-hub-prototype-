import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import type { ChannelConfig } from '@/types/channel'
import { LinkRegularIcon } from './ActionIcons'

interface ConnectionIntermediatePanelProps {
  channel: ChannelConfig
  accountName: string
  email: string
  onConnect: () => void
  onAccountNameChange: (value: string) => void
  onEmailChange: (value: string) => void
}

export function ConnectionIntermediatePanel({
  channel,
  accountName,
  email,
  onConnect,
  onAccountNameChange,
  onEmailChange,
}: ConnectionIntermediatePanelProps) {
  const isBooking = channel.id === 'booking'
  const [legalEntityId, setLegalEntityId] = useState('123123123')

  const bookingAccountName = accountName.startsWith('Booking.com') ? accountName : `Booking.com • ${accountName}`

  const handleBookingAccountNameChange = (value: string) => {
    const normalized = value.replace(/^Booking\.com\s*•\s*/, '').trimStart()
    onAccountNameChange(normalized)
  }

  if (isBooking) {
    return (
      <section className="rounded-xl border border-[#e9eaeb] bg-white px-6 py-6 shadow-[0px_1px_2px_rgba(10,13,18,0.05)]">
        <h2 className="text-[18px] leading-[28px] font-semibold text-[#181d27]">Approve Hostaway in Booking.com</h2>

        <div className="mt-5 h-px bg-[#e9eaeb]" />

        <p className="mt-5 text-[14px] leading-6 text-[#535862] max-w-[850px]">
          To connect, go to Booking.com to <span className="font-semibold text-[#414651]">approve Hostaway as a partner</span> for your Legal Entity. Once approved, come back here to finish the connection and enter your <span className="font-semibold text-[#414651]">Legal Entity ID</span>.
        </p>

        <Button
          type="button"
          variant="outline"
          className="mt-5 h-9 px-3 text-sm leading-5"
          onClick={() => window.open('https://admin.booking.com', '_blank', 'noopener,noreferrer')}
        >
          <svg className="w-5 h-5 mr-1.5 text-[#98a2b3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 4h6v6" />
            <path d="M10 14L20 4" />
            <path d="M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5" />
          </svg>
          Open Booking.com
        </Button>

        <div className="mt-5 h-px bg-[#e9eaeb]" />

        <div className="mt-6 grid grid-cols-1 gap-4 max-w-[480px]">
          <div>
            <label className="text-[14px] leading-5 font-medium text-[#344054]">
              Booking.com Legal entity ID <span className="text-[#339c99]">*</span>
            </label>
            <div className="relative mt-1">
              <Input
                value={legalEntityId}
                onChange={(event) => setLegalEntityId(event.target.value)}
                className="h-9 pr-10 text-[14px] leading-5"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98a2b3]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.6 9.6a2.4 2.4 0 1 1 4.2 1.5c-.6.8-1.6 1.1-1.8 2.4" />
                  <circle cx="12" cy="16.8" r="0.8" fill="currentColor" stroke="none" />
                </svg>
              </span>
            </div>
          </div>

          <div>
            <label className="text-[14px] leading-5 font-medium text-[#344054]">
              Account name in Hostaway <span className="text-[#339c99]">*</span>
            </label>
            <div className="relative mt-1">
              <Input
                value={bookingAccountName}
                onChange={(event) => handleBookingAccountNameChange(event.target.value)}
                className="h-9 pr-10 text-[14px] leading-5"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98a2b3]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.6 9.6a2.4 2.4 0 1 1 4.2 1.5c-.6.8-1.6 1.1-1.8 2.4" />
                  <circle cx="12" cy="16.8" r="0.8" fill="currentColor" stroke="none" />
                </svg>
              </span>
            </div>
          </div>

          <div>
            <label className="text-[14px] leading-5 font-medium text-[#344054]">
              Account email <span className="text-[#339c99]">*</span>
            </label>
            <div className="relative mt-1">
              <Input value={email} onChange={(event) => onEmailChange(event.target.value)} className="h-9 pr-10 pl-10 text-[14px] leading-5" />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M4 7l8 6 8-6" />
                </svg>
              </span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98a2b3]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.6 9.6a2.4 2.4 0 1 1 4.2 1.5c-.6.8-1.6 1.1-1.8 2.4" />
                  <circle cx="12" cy="16.8" r="0.8" fill="currentColor" stroke="none" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 h-px bg-[#e9eaeb]" />

        <Button className="mt-5 h-9 px-3 text-sm leading-5" onClick={onConnect}>
          <LinkRegularIcon className="w-5 h-5 mr-1.5" />
          Map & Import listings
        </Button>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-[#e9eaeb] bg-white px-6 py-6 shadow-[0px_1px_2px_rgba(10,13,18,0.05)]">
      <h2 className="text-[18px] leading-[28px] font-semibold text-[#181d27]">
        Map your {channel.name} account
      </h2>
      <p className="mt-1 text-[14px] leading-5 text-[#667085]">
        Complete these details and map the account. Listings will be loaded for mapping—once the process is complete, the account will be connected.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 max-w-[480px]">
        <div>
          <label className="text-[14px] leading-5 font-medium text-[#344054]">Account name</label>
          <Input value={accountName} onChange={(event) => onAccountNameChange(event.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-[14px] leading-5 font-medium text-[#344054]">Account email</label>
          <Input value={email} onChange={(event) => onEmailChange(event.target.value)} className="mt-1" />
        </div>
      </div>
      <Button className="mt-6" onClick={onConnect}>
        <LinkRegularIcon className="w-5 h-5 mr-1.5" />
        Map & Import listings
      </Button>
    </section>
  )
}
