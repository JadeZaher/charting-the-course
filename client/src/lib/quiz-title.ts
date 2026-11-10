/** Visible quiz name. Never invent a generic "Quiz Result" label when the title is missing. */
export function quizDisplayTitle(title: unknown): string {
  if (typeof title !== "string") return "Untitled quiz";
  const trimmed = title.trim();
  return trimmed || "Untitled quiz";
}
