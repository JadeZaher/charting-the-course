import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareSupportCommand, parseSupportRecordLink, readNodeAdmin, supportAuditPath, supportFieldValue } from './node-admin';
import type { SupportResourceSpec } from '../types/node-admin';

const spec: SupportResourceSpec = {
  key: 'proposals', label: 'Proposals', organization_scoped: true,
  actions: ['create', 'update', 'override_state', 'deactivate'], listing_fields: ['title', 'status'],
  fields: [
    { name: 'title', label: 'Title', type: 'string', editable: true, required: true },
    { name: 'status', label: 'Status', type: 'string', editable: true, required: false, options: ['draft', 'advice'] },
    { name: 'proposer_member_id', label: 'Author', type: 'string', editable: false, required: false },
  ],
};
test('node authority requires the explicit server assignment independently of organization or compatibility roles', () => {
  for (const value of [{ isPlatformAdmin: true }, { member: { role: 'owner', profile: 'co_creator' } }, { isNodeAdmin: 'true' }, { isNodeAdmin: false }]) assert.equal(readNodeAdmin(value), false);
  assert.equal(readNodeAdmin({ isNodeAdmin: true, member: null }), true);
});
test('a reviewed on-behalf create binds the selected organization and sends only permitted fields', () => {
  const command = prepareSupportCommand(spec, { action: 'create', organizationId: 'org-b', reason: 'Data correction', fields: { title: 'Restored proposal', status: 'draft', proposer_member_id: 'victim', sql: 'DELETE' } });
  assert.deepEqual(command.values, { title: 'Restored proposal', status: 'draft' });
  assert.equal(command.organization_id, 'org-b');
  assert.equal(command.reason, 'Data correction');
  assert.equal(command.resource_id, undefined);
  assert.throws(() => prepareSupportCommand(spec, { action: 'create', organizationId: '', reason: 'Data correction', fields: { title: 'Lost scope' } }), /organization/);
});
test('updates preserve inspection version and omitted fields, and require an actual edited field', () => {
  const base = { action: 'update', organizationId: 'org-b', resourceId: 'p-2', version: 'v-4', reason: 'Data correction', fields: { title: 'Corrected' } };
  const command = prepareSupportCommand(spec, base);
  assert.deepEqual(command.values, { title: 'Corrected' });
  assert.equal(command.expected_version, 'v-4');
  assert.equal(command.resource_id, 'p-2');
  assert.throws(() => prepareSupportCommand(spec, { ...base, fields: {} }), /at least one field/);
  assert.throws(() => prepareSupportCommand(spec, { ...base, resourceId: undefined }), /Inspect/);
  assert.throws(() => prepareSupportCommand(spec, { ...base, action: 'run_sql' }), /available support action/);
  assert.throws(() => prepareSupportCommand(spec, { ...base, fields: { status: 'forged-consent' } }), /available value/);
});
test('public reason categories are required before review', () => {
  for (const reason of ['', '  ', 'ab', 'An arbitrary private detail', ' Data correction ', 'x'.repeat(501)]) assert.throws(() => prepareSupportCommand(spec, { action: 'deactivate', organizationId: 'o', resourceId: 'p', fields: {}, reason }), /reason category/);
});
test('typed fields do not silently convert malformed numbers, booleans or JSON', () => {
  const field = { name: 'capacity', label: 'Capacity', editable: true, required: false, type: 'integer' };
  assert.equal(supportFieldValue(field, '12'), 12);
  assert.throws(() => supportFieldValue(field, '12.5'), /valid integer/);
  assert.throws(() => supportFieldValue({ ...field, type: 'boolean' }, 'yes'), /Yes or No/);
  assert.throws(() => supportFieldValue({ ...field, type: 'json' }, '{bad'), /valid JSON/);
  assert.equal(supportFieldValue({ ...field, type: 'boolean' }, 'false'), false);
});
test('audit receipts always produce an internal path from the opaque ID', () => {
  assert.equal(supportAuditPath('https://host/path'), '/node/audit/https%3A%2F%2Fhost%2Fpath');
});


test('organization assignment is taken from support scope rather than an editable foreign ID', () => {
  const scoped = { ...spec, fields: [...spec.fields, { name: 'ecosystem_id', label: 'Organization', type: 'reference', editable: true, required: true }] };
  const command = prepareSupportCommand(scoped, { action: 'create', organizationId: 'chosen-org', reason: 'Data correction', fields: { title: 'Scoped draft', ecosystem_id: 'other-org' } });
  assert.equal(command.organization_id, 'chosen-org');
  assert.equal('ecosystem_id' in command.values, false);
});
test('restoring archived evidence requires both original identity and protected snapshot reference', () => {
  const evidence = { ...spec, actions: ['inspect', 'archive_evidence', 'restore_evidence'], fields: [{ name: 'archive_id', label: 'Archive ID', type: 'text', editable: true, required: false }] };
  const base = { action: 'restore_evidence', organizationId: '', resourceId: 'original-record', fields: { archive_id: 'private-snapshot-reference' }, reason: 'Data correction' };
  assert.deepEqual(prepareSupportCommand(evidence, base).values, { archive_id: 'private-snapshot-reference' });
  assert.throws(() => prepareSupportCommand(evidence, { ...base, fields: {} }), /archive identifier/);
  assert.throws(() => prepareSupportCommand(evidence, { ...base, resourceId: '' }), /Inspect/);
});


test('the reviewed public reason exactly matches an available catalog category', () => {
  const input = { action: 'deactivate', organizationId: 'org', resourceId: 'record', fields: {}, reason: 'Account recovery', reasonCategories: ['Account recovery', 'Technical support'] };
  assert.equal(prepareSupportCommand(spec, input).reason, 'Account recovery');
  assert.throws(() => prepareSupportCommand(spec, { ...input, reasonCategories: ['Technical support'] }), /reason category/);
  assert.throws(() => prepareSupportCommand(spec, { ...input, reason: 'Unrecognized note', reasonCategories: ['Unrecognized note'] }), /reason category/);
});


test('support record links accept only local catalog resources and canonical record and organization IDs', () => {
  const id = '20000000-0000-4000-8000-000000000004';
  const org = '20000000-0000-4000-8000-000000000003';
  const href = `/admin?resource=proposals&record=${id}&organization_id=${org}`;
  assert.deepEqual(parseSupportRecordLink(href, ['proposals']), { resource: 'proposals', record: id, organizationId: org });
  assert.deepEqual(parseSupportRecordLink(`/admin?record=${id}&resource=proposals`, ['proposals']), { resource: 'proposals', record: id });
  for (const invalid of [
    `https://external.test${href}`, `//external.test${href}`, `${href}&redirect=https://external.test`, `${href}&record=${id}`,
    href.replace('resource=proposals', 'resource=private_table'), href.replace(`record=${id}`, 'record=https://external.test'),
    href.replace(`organization_id=${org}`, 'organization_id=other-org'), href.replace(`record=${id}`, `record=${id.toUpperCase().replace('0004', 'ABCD')}`),
    `${href}#inspect`, '/admin/node-admins?resource=proposals&record=' + id,
  ]) assert.equal(parseSupportRecordLink(invalid, ['proposals']), null, invalid);
});
