// Required-field state for a form: errors, focus and ARIA wiring (see client/src/AGENTS.md "Shared data and feedback contracts").
import { useId, useRef, useState } from 'react';
import {
  settleFieldError,
  validateRequired,
  type FieldErrors,
  type FieldValues,
  type RequiredMessages,
} from '@/lib/required-fields';

/** Validates required fields on submit; the caller keeps owning each field's value. */
export function useRequiredFields<Name extends string>(messages: RequiredMessages<Name>) {
  const [errors, setErrors] = useState<FieldErrors<Name>>({} as FieldErrors<Name>);
  const elements = useRef(new Map<Name, HTMLElement>());
  const refCallbacks = useRef(new Map<Name, (element: HTMLElement | null) => void>());
  const idPrefix = useId();
  const errorId = (name: Name) => `${idPrefix}-${name}-error`;

  // One stable callback ref per field, so React does not detach and re-attach it on every render.
  const refFor = (name: Name) => {
    let callback = refCallbacks.current.get(name);
    if (!callback) {
      callback = (element) => {
        if (element) elements.current.set(name, element);
        else elements.current.delete(name);
      };
      refCallbacks.current.set(name, callback);
    }
    return callback;
  };

  return {
    errors,
    /** On submit: show every blank field's message, focus the first, and return whether the form may submit. */
    validate: (values: FieldValues<Name>): boolean => {
      const { errors: found, firstInvalid } = validateRequired(values, messages);
      setErrors(found);
      if (firstInvalid) elements.current.get(firstInvalid)?.focus();
      return firstInvalid === null;
    },
    /** On change: drop the field's message once it holds text. */
    settle: (name: Name, value: string | null | undefined) => {
      setErrors((current) => settleFieldError(current, name, value));
    },
    /** Spread onto the input: ref, aria-required, aria-invalid and aria-describedby. */
    field: (name: Name) => ({
      ref: refFor(name),
      'aria-required': true as const,
      'aria-invalid': errors[name] ? (true as const) : undefined,
      'aria-describedby': errors[name] ? errorId(name) : undefined,
    }),
    /** Spread onto <FieldError>. */
    error: (name: Name) => ({ id: errorId(name), message: errors[name] }),
  };
}
