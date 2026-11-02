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
