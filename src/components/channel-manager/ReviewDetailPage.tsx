import type { ReactNode } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  Copy03,
  Edit02,
  HomeLine,
  Hourglass03,
  Link04,
  Send03,
  SlashCircle01,
  Star01,
  Trash01,
} from '@untitled-ui/icons-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  type ReviewDetailPart,
  type ReviewRecord,
  type ReviewWorkflowStatus,
} from './reviewsMockData'

const WORKFLOW_LABEL: Record<ReviewWorkflowStatus, string> = {
  published_replied: 'Published & Replied',
  published: 'Published',
  submitted: 'Submitted',
  awaiting: 'Awaiting',
  expired: 'Expired',
}

const WORKFLOW_BADGE: Record<
  ReviewWorkflowStatus,
  { className: string; Icon: typeof CheckCircle }
> = {
  published_replied: {
    className: 'border-[#abefc6] bg-[#ecfdf3] text-[#067647]',
    Icon: CheckCircle,
  },
  published: {
    className: 'border-[#b2ddff] bg-[#eff8ff] text-[#175cd3]',
    Icon: CheckCircle,
  },
  submitted: {
    className: 'border-[#d9d6fe] bg-[#f4f3ff] text-[#5925dc]',
    Icon: Send03,
  },
  awaiting: {
    className: 'border-[#fedf89] bg-[#fffaeb] text-[#b54708]',
    Icon: Hourglass03,
  },
  expired: {
    className: 'border-[#fecdca] bg-[#fef3f2] text-[#b42318]',
    Icon: SlashCircle01,
  },
}

function HeaderStatusPill({ status }: { status: ReviewWorkflowStatus }) {
  const { className, Icon } = WORKFLOW_BADGE[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-medium leading-[18px]',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {WORKFLOW_LABEL[status]}
    </span>
  )
}

function HeaderMeta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[14px] leading-5 text-[#181d27]">
      <span className="text-[#98a2b3]">{icon}</span>
      {children}
    </span>
  )
}

function OrangeStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star01
          key={i}
          className={cn('h-4 w-4 shrink-0', i < rating ? 'text-[#fd853a]' : 'text-[#e9eaeb]')}
          style={i < rating ? { fill: 'currentColor' } : undefined}
          aria-hidden
        />
      ))}
    </div>
  )
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[minmax(140px,200px)_1fr] sm:items-start sm:gap-6">
      <dt className="text-[14px] font-medium leading-5 text-[#667085]">{label}</dt>
      <dd className="min-w-0 text-[14px] leading-5 text-[#181d27]">{children}</dd>
    </div>
  )
}

function ReviewDetailSection({ title, part }: { title: string; part: ReviewDetailPart }) {
  return (
    <div className="space-y-5 border-t border-[#e9eaeb] pt-8 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <h3 className="w-full shrink-0 text-[16px] font-semibold leading-6 text-[#101828] lg:w-[180px]">
          {title}
        </h3>
        <dl className="min-w-0 flex-1 space-y-5">
          <DetailField label="Reviewer name">{part.reviewerName}</DetailField>
          <DetailField label="Rating">
            <OrangeStars rating={part.rating} />
          </DetailField>
          <DetailField label="Review">
            <p className="whitespace-pre-wrap text-[14px] leading-6 text-[#181d27]">{part.body}</p>
          </DetailField>
          <DetailField label="Private note">{part.privateNote}</DetailField>
          <DetailField label="Submitted At">{part.submittedAt}</DetailField>
          <DetailField label="Status">{part.status}</DetailField>
          <DetailField label="Channel">{part.channel}</DetailField>
        </dl>
      </div>
    </div>
  )
}

export function ReviewDetailPage({
  review,
  onBack,
}: {
  review: ReviewRecord
  onBack: () => void
}) {
  const copySummary = () => {
    const text = `${review.guestName}\n${review.reviewSnippet}\n${review.checkInDMY} — ${review.checkOutDMY}`
    void navigator.clipboard?.writeText(text)
  }

  return (
    <div className="flex min-h-0 flex-1 gap-0 transition-[gap] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#e9eaeb] bg-white shadow-[0px_1px_2px_rgba(10,13,18,0.05)]">
        <header className="border-b border-[#e9eaeb] px-6 py-3">
          <div className="flex items-end justify-between gap-6">
            <div className="min-w-0">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 text-[14px] leading-5 text-[#414651] hover:text-[#181d27]"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                Back to Reviews
              </button>
              <h1 className="mt-1 text-[20px] font-semibold leading-[30px] text-[#181d27]">
                {review.guestName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                <HeaderStatusPill status={review.workflowStatus} />
                <HeaderMeta icon={<Link04 className="h-4 w-4 shrink-0" aria-hidden />}>
                  {review.channelsLabel}
                </HeaderMeta>
                <HeaderMeta icon={<HomeLine className="h-4 w-4 shrink-0" aria-hidden />}>
                  {review.listingsScopeLabel}
                </HeaderMeta>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-center">
              <Button
                type="button"
                variant="outline"
                className="!px-2.5"
                aria-label="Copy review"
                onClick={copySummary}
              >
                <Copy03 className="h-5 w-5 shrink-0" aria-hidden />
              </Button>
              <Button type="button" variant="outline" className="!px-2.5" aria-label="Delete review">
                <Trash01 className="h-5 w-5 shrink-0" aria-hidden />
              </Button>
              <Button type="button" className="gap-1.5">
                <Edit02 className="h-5 w-5 shrink-0" aria-hidden />
                Edit
              </Button>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-[clamp(1rem,2.5vw,1.5rem)] py-8 pb-12">
          <div className="mx-auto max-w-[900px]">
            <div className="border-b border-[#e9eaeb] pb-6">
              <h2 className="text-[18px] font-semibold leading-7 tracking-tight text-[#101828]">
                Reviews
              </h2>
            </div>
            <div className="mt-8 space-y-10">
              <ReviewDetailSection title="Guest review" part={review.guestReview} />
              <ReviewDetailSection title="Host review" part={review.hostReview} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
