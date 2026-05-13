import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/cn'

type Bezier = [number, number, number, number]

export const motionTokens = {
  duration: {
    fast: 0.12,
    normal: 0.18,
    slow: 0.24,
    /** Right-rail preview / messages panels — crisp push, keeps layout-shift window short. */
    sidePanel: 0.32,
    sidePanelExit: 0.24,
  },
  easing: {
    default: [0.2, 0.8, 0.2, 1] as Bezier,
    emphasize: [0.4, 0, 0.2, 1] as Bezier,
    /** Decelerates into place — draws the eye to settled content */
    sidePanelIn: [0.16, 1, 0.3, 1] as Bezier,
    /** Accelerates out — subtle dismiss without flash */
    sidePanelOut: [0.4, 0, 1, 1] as Bezier,
  },
}

/** Matches `gap-2` between main and panel in parent flex rows. */
export const SIDE_PANEL_LAYOUT_GAP_PX = 8

const SIDE_PANEL_BASE_CLASS =
  'relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-xl border border-[#d5d7da] bg-white shadow-[8px_0_40px_-16px_rgba(10,13,18,0.2)]'

interface SlidingSidePanelProps {
  /** When false, panel runs exit animation then unmounts. */
  show: boolean
  children: ReactNode
  className?: string
  /** Stable key so swapping inner data does not replay the full slide (optional). */
  motionKey?: string
  /**
   * Panel content width in px (default 420). Parent row should use `gap-0`; this slot includes
   * {@link SIDE_PANEL_LAYOUT_GAP_PX}px before the panel so layout matches former `gap-2` push.
   */
  panelWidthPx?: number
}

/**
 * Right-edge rail: outer slot width animates in sync with the main column so flex “push” feels smooth.
 * Inner panel uses a light fade; reduced motion skips animation.
 */
export function SlidingSidePanel({
  show,
  children,
  className,
  motionKey = 'sliding-side-panel',
  panelWidthPx = 420,
}: SlidingSidePanelProps) {
  const reduceMotion = useReducedMotion()
  const slotWidth = panelWidthPx + SIDE_PANEL_LAYOUT_GAP_PX

  const slotTransition = reduceMotion
    ? { duration: 0 }
    : {
        duration: show ? motionTokens.duration.sidePanel : motionTokens.duration.sidePanelExit,
        ease: show ? motionTokens.easing.sidePanelIn : motionTokens.easing.sidePanelOut,
      }

  return (
    <motion.div
      className="box-border flex shrink-0 justify-end overflow-hidden"
      initial={reduceMotion ? false : { width: 0 }}
      animate={{ width: show ? slotWidth : 0 }}
      transition={{ width: slotTransition }}
    >
      {/* Right-anchored row: clip grows from the viewport edge inward so the rail reads as a true push. */}
      <div
        className="flex h-full min-h-0 shrink-0"
        style={{ width: slotWidth, minWidth: slotWidth }}
      >
        <div className="w-2 shrink-0" aria-hidden />
        <AnimatePresence mode="sync" initial={false}>
          {show ? (
            reduceMotion ? (
              <aside
                key={motionKey}
                className={cn(SIDE_PANEL_BASE_CLASS, className)}
                style={{ width: panelWidthPx, minWidth: panelWidthPx }}
              >
                {children}
              </aside>
            ) : (
              <motion.aside
                key={motionKey}
                className={cn(SIDE_PANEL_BASE_CLASS, className)}
                style={{ width: panelWidthPx, minWidth: panelWidthPx, transformOrigin: 'right center' }}
                initial={{ opacity: 0, x: 16 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  transition: {
                    duration: motionTokens.duration.sidePanel,
                    ease: motionTokens.easing.sidePanelIn,
                  },
                }}
                exit={{
                  opacity: 0,
                  x: 12,
                  transition: {
                    duration: motionTokens.duration.sidePanelExit,
                    ease: motionTokens.easing.sidePanelOut,
                  },
                }}
              >
                {children}
              </motion.aside>
            )
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

interface MotionPresenceProps {
  children: ReactNode
  mode?: 'sync' | 'wait' | 'popLayout'
}

export function MotionPresence({ children, mode = 'wait' }: MotionPresenceProps) {
  return (
    <AnimatePresence initial={false} mode={mode}>
      {children}
    </AnimatePresence>
  )
}

interface PageTransitionProps {
  children: ReactNode
  routeKey: string
}

export function PageTransition({ children, routeKey }: PageTransitionProps) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) {
    return <div key={routeKey}>{children}</div>
  }

  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.default }}
      className="h-full min-h-screen"
    >
      {children}
    </motion.div>
  )
}

interface FadeInProps {
  children: ReactNode
  scaleFrom?: number
  duration?: keyof typeof motionTokens.duration
}

export function FadeIn({ children, scaleFrom = 1, duration = 'normal' }: FadeInProps) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) {
    return <>{children}</>
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: scaleFrom }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: scaleFrom }}
      transition={{ duration: motionTokens.duration[duration], ease: motionTokens.easing.default }}
    >
      {children}
    </motion.div>
  )
}

interface SlideUpProps {
  children: ReactNode
  distance?: number
  duration?: keyof typeof motionTokens.duration
}

export function SlideUp({ children, distance = 12, duration = 'normal' }: SlideUpProps) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) {
    return <>{children}</>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: distance }}
      transition={{ duration: motionTokens.duration[duration], ease: motionTokens.easing.default }}
    >
      {children}
    </motion.div>
  )
}

