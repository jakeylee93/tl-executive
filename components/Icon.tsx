import type { SVGProps } from 'react'
import type { IconName } from '@/lib/site'

// One small, consistent line-icon set (24px grid, 1.5 stroke, round joins).
// Decorative by default; pass a `title` to make an icon meaningful.
const PATHS: Record<IconName | UiIcon, JSX.Element> = {
  plane: <path transform="rotate(45 12 12)" d="M12 2.5c.8 0 1.4.8 1.4 1.9v4.9l6.9 4.3v1.9l-6.9-2.1v4.5l1.9 1.4v1.5L12 20l-3.3.8v-1.5l1.9-1.4v-4.5l-6.9 2.1v-1.9l6.9-4.3V4.4c0-1.1.6-1.9 1.4-1.9Z" />,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7M3 12.5h18M10.5 12.5v1.5h3v-1.5" /></>,
  sparkle: <><path d="M12 3.5 13.7 9 19 10.5 13.7 12 12 17.5 10.3 12 5 10.5 10.3 9Z" /><path d="M18.5 16.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6Z" /></>,
  rings: <><circle cx="9" cy="14" r="5" /><circle cx="15" cy="14" r="5" /><path d="m10.5 5.5 1.5-2 1.5 2-1.5 1.5Z" /></>,
  theatre: <><path d="M3 4h18v2.5c0 1.4-1.3 2.2-2.6 1.7L12 6 5.6 8.2C4.3 8.7 3 7.9 3 6.5Z" /><path d="M5 8.5V20M19 8.5V20M3 20h18M9 20v-4a3 3 0 0 1 6 0v4" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h13l-2.5 4L18 12H5" /><path d="M9 4v8M13 4v8M5 8h13" opacity=".55" /></>,
  stadium: <><ellipse cx="12" cy="9" rx="9" ry="3.5" /><path d="M3 9v6c0 1.9 4 3.5 9 3.5s9-1.6 9-3.5V9" /><path d="M8 12.2v6M16 12.2v6M12 12.5v6" /></>,
  ship: <><path d="M3 15.5 5 20h14l2-4.5-9-2.5Z" /><path d="M6 14.2V9h12v5.2M9 9V6h6v3M12 3v3" /></>,
  dining: <><path d="M7 3v7.5M4.5 3v4.5A2.5 2.5 0 0 0 7 10a2.5 2.5 0 0 0 2.5-2.5V3M7 10.5V21" /><path d="M17 21V3c-2 1.2-3 3.8-3 7.5 0 1.4.9 2.5 3 2.5" /></>,
  road: <><path d="M9 3 5 21M15 3l4 18" /><path d="M12 4v2.5M12 10v3M12 16.5v3" /></>,
  music: <><path d="M9 18V6l11-2.5v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="15.5" r="2.5" /></>,
  care: <><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M12 8v8M8 12h8" /></>,
  bag: <><path d="M5 8h14l-1 12.5H6Z" /><path d="M9 10V6.5a3 3 0 0 1 6 0V10" /></>,
  phone: <path d="M6.6 3.5h2.2l1.6 4.2-2 1.4a11.5 11.5 0 0 0 6.5 6.5l1.4-2 4.2 1.6v2.2a2 2 0 0 1-2.1 2A15.8 15.8 0 0 1 4.6 5.6a2 2 0 0 1 2-2.1Z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6.5 8.5-6.5" /></>,
  arrowRight: <path d="M4 12h15m-6-6 6 6-6 6" />,
  arrowDown: <path d="M12 4v15m-6-6 6 6 6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  swap: <path d="M8 4v15m0 0-3.5-3.5M8 19l3.5-3.5M16 20V5m0 0-3.5 3.5M16 5l3.5 3.5" />,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" /><path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.4 3.5 5.2" /></>,
  suitcase: <><rect x="4.5" y="7" width="15" height="12.5" rx="2" /><path d="M9 7V4.5h6V7M8 21v-1.5M16 21v-1.5M9 11v5M15 11v5" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  pin: <><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.2v.3" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.8v.3" /></>,
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  shield: <><path d="M12 3 5 6v5.5c0 4.3 2.9 7.8 7 9.5 4.1-1.7 7-5.2 7-9.5V6Z" /><path d="m9 12 2.2 2.2L15.5 10" /></>,
}

export type UiIcon =
  | 'phone' | 'mail' | 'arrowRight' | 'arrowDown' | 'chevronDown' | 'close' | 'menu' | 'swap'
  | 'users' | 'suitcase' | 'check' | 'clock' | 'pin' | 'calendar' | 'alert' | 'info' | 'minus' | 'plus' | 'shield'

export function Icon({ name, title, className = 'h-5 w-5', strokeWidth = 1.5, ...rest }: { name: IconName | UiIcon; title?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  )
}
