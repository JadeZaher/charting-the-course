import { quizChoices, type QuizChoice, type QuizChoiceValue } from './quiz-answer';
export interface QuizQuestion {
  name: string;
  type: string;
  title: string;
  choices?: QuizChoice[];
  correctAnswer?: QuizChoiceValue | QuizChoiceValue[];
  isRequired?: boolean;
  [key: string]: unknown;
}
export function quizQuestions(raw: string): QuizQuestion[] {
  if (!raw.trim()) return [];
  const value = JSON.parse(raw);
  if (!value || !Array.isArray(value.pages)) throw new Error('Quiz content must contain pages and questions.');
  return value.pages.flatMap((page: { elements?: QuizQuestion[] }) => page.elements || []);
}
export function questionChoiceText(choice: QuizChoice): string {
  return typeof choice === 'object' ? choice.text ?? String(choice.value) : String(choice);
}
export function serializeQuiz(questions: QuizQuestion[]): string {
  return JSON.stringify({ pages: [{ name: 'questions', elements: questions }] });
}
export function quizCompletionMode(questions: QuizQuestion[]): 'graded' | 'completion' {
  return questions.some(question => question.correctAnswer != null) ? 'graded' : 'completion';
}
export function quizQuestionErrors(questions: QuizQuestion[]): string[] {
  const errors: string[] = [];
  if(!questions.length) errors.push('Add at least one quiz question.');
  const names = new Set<string>();
  questions.forEach((question, index) => {
    const label = `Question ${index + 1}`;
    if (!question.title.trim()) errors.push(`${label}: enter the question.`);
    if (!question.name || names.has(question.name)) errors.push(`${label}: use a unique question key.`);
    names.add(question.name);
    if (['radiogroup', 'checkbox', 'dropdown'].includes(question.type) && (question.choices?.length || 0) < 2) errors.push(`${label}: add at least two answer choices.`);
    if (question.correctAnswer !== undefined && question.choices) {
      const allowed = quizChoices(question.choices).map(choice => choice.value);
      const answers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
      if (answers.some(answer => !allowed.includes(answer))) errors.push(`${label}: choose the correct answer from its current choices.`);
    }
  });
  return errors;
}
