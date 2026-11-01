// Inline error for one form field (see client/src/AGENTS.md "Shared data and feedback contracts").

/** A field's error text, announced when it appears; renders nothing while the field is valid. */
export function FieldError({ id, message }: { id: string; message?: string | null }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}
