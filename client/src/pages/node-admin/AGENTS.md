# Node support interface

Node administration is a global user assignment asserted by `/auth/me` `is_node_admin`.
Organization roles, selected ecosystem cookies, achievement badges and editable
profiles confer no node authority. The support selector is local to this page.
Protected query keys include the signed-in global user.

The server catalog defines every exposed field and action. Inspecting a record is
an intentional reasoned request. Commands have a separate review step naming the
target, action, changed values and public reason category. Only edited allowlisted fields
are sent, with the inspected version for stale-write checks. Receipts use the audit
ID to construct internal links. Successful commands invalidate cached feature data
and refresh auth so self-revocation immediately closes the page.

Public audit UI renders the public serializer's metadata and changed field names.
It never renders private bodies, command payloads or raw error traces. Technical
corrections do not manufacture advice, assent, test evidence or membership consent.
Proposal provenance identifies the real actor and on-behalf organization.

Reason controls use the catalog reason_categories allowlist. No free-text reason
notes are collected; preview and support chat use the exact category stored publicly.

Support receipt links use /admin?resource=<catalog-key>&record=<UUID> with an
optional organization_id UUID. Only local catalog keys and canonical identifiers
are accepted. Navigation sets the family, scope and identifier filter, and never
opens private detail automatically; inspection still requires a category and click.
Memberless node admins do not start ordinary member polling or human messaging.

Audit actor identity alone does not assert a current or historical NodeAdmin role.
Audit entries carry no role badge; denied requests can name ordinary users. The
official active operator roster retains its server-derived authority badges.


## Task navigation and structured authoring

Entry requirements support graded knowledge quizzes and verified-completion questionnaires. Answer keys
select graded mode; without keys, readiness or preference questions use completion mode even when the
legacy quiz `mode` says `standard`. Review requires valid questions and a valid passing threshold only
for graded entry quizzes. Candidate completion never fabricates a passing score or agreement consent.
Orientation's NodeAdmin exemption button sends an explicit request; the backend freshly checks the role,
records a public exemption, and creates no quiz result. Ordinary users cannot use this control.

`lib/admin-tasks.ts` maps support task routes to registered resource families. Circles use domain and circle-membership records; no new authority model is implied. Quizzes, journeys, take-away packages and governed matching policy use structured editors with advanced JSON fallbacks. Reference fields use explicit search-and-select controls and retain exact-ID entry for technical corrections. Review names the chosen organization and record, with IDs as secondary evidence. Missing or invalid grading/source fields stop review before a command is sent.

The Ecosystems task publishes an already approved matching profile using a selected support organization, an active same-ecosystem policy, a catalog reason category and a separate review. A node assignment allows this technical publication without fabricated ecosystem membership; it never permits changing private matching answers or inventing an approval.


Journey quiz choices use the explicit support-owner lookup mode, never the Member-gated ordinary quiz list. The lookup calls the audited, organization-scoped `quizzes` catalog with a name search and recognizable labels; it remains usable for a NodeAdmin with no Member row. Changing owner or organization separates the cache. Selecting a quiz changes form data only; saving still requires the normal review and public support receipt. The ordinary steward editor continues using its own scoped quiz endpoint.

Runtime reviews use `SupportValueReview`: questions, answer choices/keys, completion versus grading, effective publication/entry policy, named scope references, ordered journey steps and take-away resources are readable before confirmation. Exact structured data remains under an advanced disclosure. Reference names come only from the already authorized catalog listing, never an automatic reasoned private inspection.

Following an audit link preserves only the support organization, resource family, search, pagination and view section in session storage, keyed by the signed-in owner and task path. Returning restores those navigation filters. Reasons, inspected bodies, command fields, versions and pending confirmations are never stored or restored. Receipt URLs keep their existing safe record-filter behavior and never trigger an inspection or command automatically.
