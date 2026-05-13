import type { SVGProps } from 'react'
import { Download01, Link01, LinkBroken01, Upload01 } from '@untitled-ui/icons-react'

type IconProps = SVGProps<SVGSVGElement> & { className?: string }

const defaultSize = { width: 20, height: 20 } as const

export function ImportIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return <Download01 {...defaultSize} className={className} aria-hidden {...props} />
}

export function ExportIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return <Upload01 {...defaultSize} className={className} aria-hidden {...props} />
}

export function LinkRegularIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return <Link01 {...defaultSize} className={className} aria-hidden {...props} />
}

export function LinkBrokenIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return <LinkBroken01 {...defaultSize} className={className} aria-hidden {...props} />
}
