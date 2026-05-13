import { SlidingSidePanel } from '@/lib/motion'
import type { OpenReservationOptions, ReservationListItem } from './ReservationListPage'
import { ReservationPreviewPanelBody } from './ReservationPreviewPanelBody'

/**
 * Calendar reservation preview: same shell and inner UI as the reservations list quick-view panel.
 */
export function ReservationSlidingPreviewPanel({
  reservation,
  onClose,
  onOpenFullscreen,
  onApplyReservationPatch,
  paginationCompact = false,
}: {
  reservation: ReservationListItem | null
  onClose: () => void
  onOpenFullscreen: (r: ReservationListItem, options?: OpenReservationOptions) => void
  onApplyReservationPatch: (id: string, partial: Partial<ReservationListItem>) => void
  paginationCompact?: boolean
}) {
  return (
    <SlidingSidePanel show={!!reservation} motionKey="calendar-reservation-preview-panel">
      {reservation ? (
        <ReservationPreviewPanelBody
          reservation={reservation}
          onClose={onClose}
          onOpenFullscreen={onOpenFullscreen}
          onApplyReservationPatch={onApplyReservationPatch}
          paginationCompact={paginationCompact}
        />
      ) : null}
    </SlidingSidePanel>
  )
}
