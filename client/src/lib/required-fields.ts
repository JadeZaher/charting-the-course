// Required-field validation core for forms (see client/src/AGENTS.md "Shared data and feedback contracts").

/** Field name -> message shown when that field is blank. Key order is the form's focus order. */
export type RequiredMessages<Name extends string> = Readonly<Record<Name, string>>;

/** Current value of each required field. */
export type FieldValues<Name extends string> = Readonly<Record<Name, string | null | undefined>>;

/** Message for each field that is currently invalid. */
export type FieldErrors<Name extends string> = Readonly<Partial<Record<Name, string>>>;

/** True for null, undefined and whitespace-only text. */
export function isBlank(value: string | null | undefined): boolean {
  return value == null || value.trim() === '';
}

/** Errors for every blank field, and the first of them in form order (null when the form is valid). */
export function validateRequired<Name extends string>(
  values: FieldValues<Name>,
  messages: RequiredMessages<Name>,
): { errors: FieldErrors<Name>; firstInvalid: Name | null } {
  const invalid = (Object.keys(messages) as Name[]).filter((name) => isBlank(values[name]));
  const errors = Object.fromEntries(invalid.map((name) => [name, messages[name]])) as FieldErrors<Name>;
  return { errors, firstInvalid: invalid[0] ?? null };
}

/** Clears a shown error once its field is filled; never adds one, so errors appear on submit and leave while typing. */
export function settleFieldError<Name extends string>(
  errors: FieldErrors<Name>,
  name: Name,
  value: string | null | undefined,
): FieldErrors<Name> {
  if (!(name in errors) || isBlank(value)) return errors;
  const { [name]: _cleared, ...rest } = errors;
  return rest as FieldErrors<Name>;
}
