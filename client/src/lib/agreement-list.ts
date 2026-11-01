// The agreement registry's URL filters (`?review=overdue&ecosystem_id=<id>`, the health page's link); see client/src/AGENTS.md "Pass 03 fixes".
import { idFromQuery } from './exchange';

export interface AgreementListScope {
  /** Only agreements the server flags `review_overdue`. */
  overdueOnly: boolean;
  /** Only that ecosystem's own agreements (not those shared into it); a plain id or null. */
  ecosystemId: string | null;
}

/** The filters a registry URL asks for; a value that is not a plain id is dropped, so it never reaches a request. */
export function agreementListScope(queryString: string): AgreementListScope {
  return {
    overdueOnly: new URLSearchParams(queryString).get('review') === 'overdue',
    ecosystemId: idFromQuery(queryString, 'ecosystem_id'),
  };
}

/** The list request's parameters for that scope, on top of the page's own (selection, filters, page). */
export function agreementListParams(base: Record<string, string>, scope: AgreementListScope): Record<string, string> {
  return {
    ...base,
    ...(scope.overdueOnly ? { review: 'overdue' } : {}),
    ...(scope.ecosystemId ? { ecosystem_id: scope.ecosystemId } : {}),
  };
}

/** The items the page shows: an older server ignores `review` and `ecosystem_id`, so the page applies both itself. */
export function inAgreementListScope<T extends { review_overdue?: boolean; ecosystem_id: string }>(
  items: readonly T[],
  scope: AgreementListScope,
): T[] {
  return items.filter((item) => (!scope.overdueOnly || item.review_overdue === true)
    && (!scope.ecosystemId || item.ecosystem_id === scope.ecosystemId));
}
