import type { JourneyStep } from '../types/orientation';

export function journeyRouteErrors(steps: JourneyStep[]): string[] {
  return steps.flatMap((step, index) => {
    const names = (step.choices || []).map(choice => choice.value);
    const routes = step.choice_routes === undefined ? {} : step.choice_routes;
    if (!routes || typeof routes !== 'object' || Array.isArray(routes)) return [`Step ${index + 1}: use named choice destinations.`];
    if (Object.keys(routes).length && step.type !== 'choice') return [`Step ${index + 1}: only choices can route to another step.`];
    if (step.type === 'choice' && new Set(names).size !== names.length) return [`Step ${index + 1}: use unique choice keys.`];
    return Object.entries(routes).flatMap(([choice, destination]) => !names.includes(choice) || !Number.isInteger(destination) || destination <= index || destination > steps.length
      ? [`Step ${index + 1}: each choice must lead to a later step or the end of the journey.`] : []);
  });
}

export function journeyDestination(steps: JourneyStep[], index: number, response: unknown): number {
  const step = steps[index];
  if (!step || journeyRouteErrors(steps).length) throw new Error('This journey has an invalid path. Ask a steward to repair it.');
  const choice = response && typeof response === 'object' && 'choice' in response ? response.choice : undefined;
  if (step.type === 'choice' && (step.required || choice !== undefined) && !step.choices?.some(item => item.value === choice)) throw new Error('Choose a path before continuing.');
  return typeof choice === 'string' && step.choice_routes?.[choice] !== undefined ? step.choice_routes[choice] : index + 1;
}

export function previousJourneyStep(steps: JourneyStep[], current: number, responses: Record<string, unknown>): number {
  let index = 0, previous = 0;
  while (index < current && index < steps.length) {
    previous = index;
    index = journeyDestination(steps, index, responses[`step_${index}`]);
  }
  return previous;
}

export function reorderJourneySteps(steps: JourneyStep[], order: number[]): JourneyStep[] {
  return order.map(original => {
    const step = steps[original];
    if (!step.choice_routes) return step;
    return {...step, choice_routes: Object.fromEntries(Object.entries(step.choice_routes).map(([choice, target]) =>
      [choice, target === steps.length ? order.length : order.indexOf(target)]))};
  });
}
