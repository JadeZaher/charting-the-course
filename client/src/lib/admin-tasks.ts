export const ADMIN_TASKS = [
  { key: 'users', label: 'Users', description: 'Find accounts, correct profiles and manage access.', resources: ['users', 'members'] },
  { key: 'ecosystems', label: 'Ecosystems', description: 'Manage organizations, published information and membership configuration.', resources: ['ecosystems', 'agreements'] },
  { key: 'domains', label: 'Domains', description: 'Maintain bounded responsibilities, stewards and domain contracts.', resources: ['domains', 'domain_elements', 'domain_metrics'] },
  { key: 'circles', label: 'Circles', description: 'Manage circles through their bounded domain and participation records.', resources: ['domains', 'circle_memberships'] },
  { key: 'teams', label: 'Teams', description: 'Manage teams, participation and configured entry quizzes.', resources: ['teams', 'team_members', 'quizzes'] },
  { key: 'learning', label: 'Onboarding & quizzes', description: 'Build and publish entry quizzes, choose their scope, and maintain orientation journeys.', resources: ['quizzes', 'courses', 'journey_maps', 'user_journey_progress', 'member_onboarding', 'quiz_assignments'] },
] as const;

export function adminTaskFromPath(path: string) {
  const key = path.split('?')[0].split('/')[2];
  return ADMIN_TASKS.find(task => task.key === key);
}

export function supportRecordName(record: Record<string, unknown> | null | undefined): string {
  if (!record) return '';
  return ['display_name', 'name', 'title', 'username', 'member_id', 'domain_id', 'quiz_id'].map(key => record[key]).find(value => typeof value === 'string' && value.trim()) as string || String(record.id || 'Record');
}
