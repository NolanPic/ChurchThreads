import {
  useId,
  forwardRef,
  useState,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import styles from "./Input.module.css";
import {
  validateTextField,
  validateEmailField,
  validateNumberField,
  TextFieldValidationOptions,
} from "@/validation";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  type?: "text" | "email" | "number";
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  validationConfig?: TextFieldValidationOptions;
  fieldName?: string;
}

export interface InputHandle {
  validate: () => boolean;
  getValue: () => string;
  focus: () => void;
  hasError: () => boolean;
}

export const Input = forwardRef<InputHandle, InputProps>(
  (
    {
      label,
      type = "text",
      error,
      helperText,
      required = false,
      disabled = false,
      placeholder,
      className,
      id,
      validationConfig,
      fieldName,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [internalError, setInternalError] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);

    // Generate unique IDs for accessibility
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const errorId = error || internalError ? `${inputId}-error` : undefined;
    const helperTextId = helperText ? `${inputId}-helper` : undefined;

    // Validation handler
    const handleValidation = useCallback(
      (value: string) => {
        if (!validationConfig) return true;

        const name = fieldName || label;
        let result;

        if (type === "email") {
          result = validateEmailField(value, validationConfig, name);
        } else if (type === "number") {
          result = validateNumberField(value, validationConfig, name);
        } else {
          result = validateTextField(value, validationConfig, name);
        }

        if (!result.valid && result.errors.length > 0) {
          setInternalError(result.errors[0].message);
          return false;
        } else {
          setInternalError("");
          return true;
        }
      },
      [validationConfig, fieldName, label, type]
    );

    // Expose validation method to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        validate: () => {
          const value = inputRef.current?.value || "";
          return handleValidation(value);
        },
        getValue: () => inputRef.current?.value || "",
        focus: () => inputRef.current?.focus(),
        hasError: () => Boolean(error || internalError),
      }),
      [handleValidation, error, internalError]
    );

    // Handle blur event
    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        if (validationConfig) {
          handleValidation(e.target.value);
        }
        onBlur?.(e);
      },
      [validationConfig, handleValidation, onBlur]
    );

    const displayError = error || internalError;
    const hasError = Boolean(displayError);

    // Extract maxLength from validationConfig for HTML attribute
    const maxLengthAttr = validationConfig?.maxLength;

    return (
      <div className={`${styles.inputWrapper} ${className || ""}`}>
        <label
          htmlFor={inputId}
          className={`${styles.label} ${disabled ? styles.disabled : ""}`}
        >
          {label}
        </label>

        <input
          ref={inputRef}
          id={inputId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLengthAttr}
          aria-invalid={hasError}
          aria-describedby={
            [errorId, helperTextId].filter(Boolean).join(" ") || undefined
          }
          className={`${styles.input} ${hasError ? styles.error : ""} ${disabled ? styles.disabled : ""}`}
          {...props}
          onBlur={handleBlur}
        />

        {helperText && !displayError && (
          <div id={helperTextId} className={styles.helperText}>
            {helperText}
          </div>
        )}

        {displayError && (
          <div id={errorId} className={styles.errorMessage} role="alert">
            {displayError}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
