import { FormEvent, RefObject } from "react";
import { InputHandle } from "./Input";
import { SelectHandle } from "./Select";

interface FormProps {
  fields: RefObject<InputHandle | SelectHandle | null>[];
  onSubmit: () => void | Promise<void>;
  onInvalidSubmit?: () => void;
  renderSubmit: (props: { hasErrors: boolean }) => React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function Form({
  fields,
  onSubmit,
  onInvalidSubmit,
  renderSubmit,
  children,
  className,
}: FormProps) {
  // Check if any field has validation errors
  const hasErrors = (): boolean => {
    return fields.some((fieldRef) => {
      const field = fieldRef.current;
      if (!field) return false;
      // Check if field has hasError method and call it
      return "hasError" in field && typeof field.hasError === "function"
        ? field.hasError()
        : false;
    });
  };

  // Validate all fields
  const validateAllFields = (): boolean => {
    let allValid = true;

    fields.forEach((fieldRef) => {
      const field = fieldRef.current;
      if (field && "validate" in field && typeof field.validate === "function") {
        const isValid = field.validate();
        if (!isValid) {
          allValid = false;
        }
      }
    });

    return allValid;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields
    const isValid = validateAllFields();

    if (isValid) {
      await onSubmit();
    } else {
      onInvalidSubmit?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
      {renderSubmit({ hasErrors: hasErrors() })}
    </form>
  );
}
