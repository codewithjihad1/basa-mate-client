import type { UseFormSetError, FieldValues, Path } from "react-hook-form";
import { toast } from "sonner";
import { normalizeApiError } from "./errors";

/**
 * Maps a failed mutation onto a form: field-level issues from a `400 VALIDATION_ERROR`
 * land on their inputs, and anything else surfaces as a toast plus a form-level message.
 *
 * This is the one place server errors become form errors, so no screen has to
 * reimplement the mapping (frontend-requirements §25).
 */
export function applyApiErrorToForm<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  options: { toastOnGeneral?: boolean } = {},
): void {
  const { toastOnGeneral = true } = options;
  const normalized = normalizeApiError(error);
  const fieldPaths = Object.keys(normalized.fieldErrors);

  fieldPaths.forEach((path) => {
    setError(path as Path<T>, { type: "server", message: normalized.fieldErrors[path] });
  });

  if (fieldPaths.length === 0) {
    setError("root.serverError" as Path<T>, { type: "server", message: normalized.message });
    if (toastOnGeneral) toast.error(normalized.message);
  }
}
