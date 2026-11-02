export const PUBLIC_SUPPORT_REASONS = [
  'Technical support', 'Account recovery', 'Organization support', 'Agent testing',
  'Data correction', 'Access management', 'Service recovery',
] as const;

export function isPublicSupportReason(value: string, categories: readonly string[] = PUBLIC_SUPPORT_REASONS): boolean {
  return categories.includes(value) && PUBLIC_SUPPORT_REASONS.some(category => category === value);
}
