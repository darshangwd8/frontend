import clsx from 'clsx'
import { ReactNode, useState } from 'react'

import { isPrintMode } from '../print-mode'
import { submitEventWithPath } from '@/helper/submit-event'
import { NodePath } from '@/schema/article-renderer'

export interface SpoilerProps {
  body: ReactNode
  title: ReactNode
  path: NodePath
}

export function Spoiler({ body, title, path }: SpoilerProps) {
  const [open, setOpen] = useState(isPrintMode ? true : false)
  return (
    <div className="flex flex-col mb-block mobile:mx-side">
      <SpoilerTitle
        onClick={() => {
          setOpen(!open)
          if (!open) {
            submitEventWithPath('openspoiler', path)
          }
        }}
        open={open}
      >
        <SpoilerToggle open={open} />
        {title}
      </SpoilerTitle>
      {open && body}
    </div>
  )
}

function SpoilerTitle({
  open,
  children,
  onClick,
  disabled,
}: {
  open: boolean
  children: {}
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
  disabled?: boolean
}) {
  const opened = typeof window === 'undefined' ? true : open

  return (
    <button
      onClick={!disabled ? onClick : undefined}
      onPointerUp={(e) => e.currentTarget.blur()} //hack, use https://caniuse.com/#feat=css-focus-visible when supported
      className={clsx(
        'serlo-input-font-reset border-none m-0 text-lg',
        'leading-normal',
        'py-2.5 px-side',
        disabled
          ? 'cursor-auto text-truegray-800 bg-brand-150'
          : 'cursor-pointer',
        'text-left',
        opened ? 'text-white bg-brand' : 'text-truegray-800 bg-brand-100'
      )}
    >
      {children}
    </button>
  )
}

function SpoilerToggle({ open }: { open: boolean }) {
  return <span className="inline w-4">{open ? '▾ ' : '▸ '} </span>
}
