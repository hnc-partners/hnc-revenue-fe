/**
 * AppLink — MF-safe replacement for TanStack Router's <Link>.
 *
 * Renders a standard <a> tag. On click, uses pushState + popstate
 * to trigger shell router navigation without importing @tanstack/react-router.
 *
 * Supports route param interpolation ($paramName) and search params.
 */

import { type ReactNode, type AnchorHTMLAttributes, useCallback } from 'react';
import { navigateTo } from './use-safe-navigate';

interface AppLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** Target path pattern, e.g. '/revenue/statements/$brandCode' */
  to: string;
  /** Route params to interpolate, e.g. { brandCode: 'abc' } */
  params?: Record<string, string>;
  /** Search/query params */
  search?: Record<string, string | undefined>;
  children: ReactNode;
}

/**
 * Build an href string from to + params + search for the <a> tag.
 */
function buildHref(
  to: string,
  params?: Record<string, string>,
  search?: Record<string, string | undefined>
): string {
  let path = to;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`$${key}`, encodeURIComponent(value));
    }
  }
  if (search) {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== '') {
        sp.set(key, value);
      }
    }
    const qs = sp.toString();
    if (qs) {
      path += `?${qs}`;
    }
  }
  return path;
}

export function AppLink({
  to,
  params,
  search,
  children,
  onClick,
  ...rest
}: AppLinkProps) {
  const href = buildHref(to, params, search);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Allow modifier keys for open-in-new-tab behavior
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      e.preventDefault();
      navigateTo({ to, params, search });

      // Call user-provided onClick if any
      onClick?.(e);
    },
    [to, params, search, onClick]
  );

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
