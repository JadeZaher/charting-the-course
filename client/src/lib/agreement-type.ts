// Agreement.type vocabulary — single source of truth, shared by AgreementForm + AgreementList.
// 'universal_field' legacy alias maps to 'uaf'; 'operational' is NOT valid here (that's a hierarchy_level value).

export const AGREEMENT_TYPES = [
  'uaf',
  'ecosystem',
  'access',
  'stewardship',
  'ethos',
  'culture_code',
  'space',
  'organizational',
  'policy',
  'protocol',
  'role_definition',
  'domain_contract',
  'guideline',
] as const;

export type AgreementType = (typeof AGREEMENT_TYPES)[number];

const AGREEMENT_TYPE_LABELS: Record<AgreementType, string> = {
  uaf: 'Universal Agreement Field',
  ecosystem: 'Ecosystem',
  access: 'Access',
  stewardship: 'Stewardship',
  ethos: 'Ethos',
  culture_code: 'Culture Code',
  space: 'Space',
  organizational: 'Organizational',
  policy: 'Policy',
  protocol: 'Protocol',
  role_definition: 'Role Definition',
  domain_contract: 'Domain Contract',
  guideline: 'Guideline',
};

/** Select/filter options for the Agreement type field, typed to AgreementType. */
export const AGREEMENT_TYPE_OPTIONS: { value: AgreementType; label: string }[] =
  AGREEMENT_TYPES.map((value) => ({ value, label: AGREEMENT_TYPE_LABELS[value] }));
