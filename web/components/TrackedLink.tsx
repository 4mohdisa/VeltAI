'use client';

// Anchor that reports a GA event on click — silently a plain link when GA never
// loaded (no id / no consent / DNT): sendGAEvent no-ops without gtag.
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { sendGAEvent } from '@next/third-parties/google';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  event: string;
  children: ReactNode;
};

export function TrackedLink({ event, children, onClick, ...rest }: Props) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        try {
          sendGAEvent('event', event, { link_url: rest.href ?? '' });
        } catch {
          // gtag absent — consent declined or GA unset
        }
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
