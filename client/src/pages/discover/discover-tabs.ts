// Discover hub tab state lives in ?tab= so links (e.g. after publishing a share) can open a tab and reloads keep it.

export const DISCOVER_TABS = ['ecosystems', 'solutions', 'shares-needs', 'collaborations'] as const;
export type DiscoverTab = (typeof DISCOVER_TABS)[number];
export const DEFAULT_DISCOVER_TAB: DiscoverTab = 'ecosystems';

export function isDiscoverTab(value: string | null | undefined): value is DiscoverTab {
  return value != null && (DISCOVER_TABS as readonly string[]).includes(value);
}

/** The tab a query string selects; unknown or missing values fall back to the default tab. */
export function discoverTabFromQuery(queryString: string): DiscoverTab {
  const requested = new URLSearchParams(queryString).get('tab');
  return isDiscoverTab(requested) ? requested : DEFAULT_DISCOVER_TAB;
}

/** URL for `tab` that keeps the other query params; the default tab drops ?tab= entirely. */
export function discoverTabHref(path: string, queryString: string, tab: DiscoverTab): string {
  const params = new URLSearchParams(queryString);
  if (tab === DEFAULT_DISCOVER_TAB) params.delete('tab');
  else params.set('tab', tab);
  const nextQuery = params.toString();
  return nextQuery ? `${path}?${nextQuery}` : path;
}
