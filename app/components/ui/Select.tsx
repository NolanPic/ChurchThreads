"use client";

import {
  useId,
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Select.module.css";
import Icon from "./Icon";
import {
  validateSelectField,
  SelectFieldValidationOptions,
} from "@/validation";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  options?: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
  prependToSelected?: string;
  className?: string;
  validationConfig?: SelectFieldValidationOptions;
  fieldName?: string;
}

export interface SelectHandle {
  validate: () => boolean;
  getValue: () => string;
  hasError: () => boolean;
}

export const Select = forwardRef<SelectHandle, SelectProps>(
  (
    {
      label,
      options,
      value,
      defaultValue,
      onChange,
      error,
      helperText,
      disabled = false,
      placeholder = "Select an option",
      prependToSelected,
      className,
      validationConfig,
      fieldName,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [internalValue, setInternalValue] = useState(defaultValue || "");
    const [internalError, setInternalError] = useState<string>("");
    const [hasBlurred, setHasBlurred] = useState(false);
    const selectRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const [menuPosition, setMenuPosition] = useState<{
      top: number;
      left: number;
      width: number;
    } | null>(null);

    // Support both controlled and uncontrolled modes
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    // Validation handler
    const handleValidation = useCallback(
      (val: string) => {
        if (!validationConfig || !hasBlurred) return true;

        const name = fieldName || label || "This field";
        const result = validateSelectField(val, validationConfig, name);

        if (!result.valid && result.errors.length > 0) {
          setInternalError(result.errors[0].message);
          return false;
        } else {
          setInternalError("");
          return true;
        }
      },
      [validationConfig, fieldName, label, hasBlurred]
    );

    // Expose validation method to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        validate: () => {
          setHasBlurred(true);
          const name = fieldName || label || "This field";
          if (!validationConfig) return true;

          const result = validateSelectField(currentValue, validationConfig, name);
          if (!result.valid && result.errors.length > 0) {
            setInternalError(result.errors[0].message);
            return false;
          } else {
            setInternalError("");
            return true;
          }
        },
        getValue: () => currentValue,
        hasError: () => !!internalError,
      }),
      [currentValue, validationConfig, fieldName, label, internalError]
    );

    // Run validation when value changes (after first blur)
    useEffect(() => {
      if (hasBlurred) {
        handleValidation(currentValue);
      }
    }, [currentValue, hasBlurred, handleValidation]);

    // Generate unique IDs for accessibility
    const generatedId = useId();
    const selectId = `select-${generatedId}`;
    const listboxId = `${selectId}-listbox`;
    const displayError = error || internalError;
    const errorId = displayError ? `${selectId}-error` : undefined;
    const helperTextId = helperText ? `${selectId}-helper` : undefined;
    const hasError = Boolean(displayError);
    const selectedOption = options?.find(
      (option) => option.value === currentValue
    );

    // Generate display text and tooltip for selected option
    const selectedDisplayText = selectedOption
      ? `${prependToSelected || ""}${selectedOption.label}`
      : placeholder;
    const selectedTooltip = selectedOption
      ? `${prependToSelected || ""}${selectedOption.label}`
      : undefined;

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        const clickedInsideTrigger =
          !!containerRef.current && containerRef.current.contains(target);
        const clickedInsideMenu =
          !!listRef.current && listRef.current.contains(target);

        if (!clickedInsideTrigger && !clickedInsideMenu) {
          setIsOpen(false);
          setFocusedIndex(-1);
          setHasBlurred(true); // Track blur for validation
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen]);

    // Position the dropdown using a portal to avoid clipping by overflow
    useEffect(() => {
      if (!isOpen) return;

      const updatePosition = () => {
        const trigger = containerRef.current;
        if (!trigger) return;
        const rect = trigger.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom,
          left: rect.left,
          width: rect.width,
        });
      };

      updatePosition();

      // Recompute on resize and on any scroll (capture phase to catch scrolling containers)
      window.addEventListener("resize", updatePosition);
      document.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        document.removeEventListener("scroll", updatePosition, true);
      };
    }, [isOpen]);

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "Enter":
        case " ":
          event.preventDefault();
          if (isOpen && focusedIndex >= 0) {
            const option = options?.[focusedIndex];
            handleOptionSelect(option?.value ?? "");
          } else {
            setIsOpen(!isOpen);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
        case "ArrowDown":
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setFocusedIndex(0); // Start at first option when opening
          } else {
            const nextIndex = Math.min(
              focusedIndex + 1,
              (options?.length ?? 0) - 1
            );
            setFocusedIndex(nextIndex);
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          if (isOpen) {
            const prevIndex = Math.max(focusedIndex - 1, 0);
            setFocusedIndex(prevIndex);
          }
          break;
      }
    };

    const handleOptionSelect = (optionValue: string) => {
      if (!isControlled) {
        setInternalValue(optionValue);
      }
      onChange?.(optionValue);
      setIsOpen(false);
      setFocusedIndex(-1);
      selectRef.current?.focus();
    };

    const handleOptionClick = (option: SelectOption) => {
      handleOptionSelect(option.value);
    };

    return (
      <div className={`${styles.selectWrapper} ${className || ""}`}>
        {label && (
          <label
            htmlFor={selectId}
            className={`${styles.label} ${disabled ? styles.disabled : ""}`}
          >
            {label}
          </label>
        )}

        <div className={styles.selectContainer} ref={containerRef}>
          <button
            ref={selectRef}
            id={selectId}
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label={!label ? placeholder : undefined}
            aria-labelledby={label ? selectId : undefined}
            aria-describedby={
              [errorId, helperTextId].filter(Boolean).join(" ") || undefined
            }
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            className={`${styles.select} ${hasError ? styles.error : ""} ${disabled ? styles.disabled : ""}`}
            {...props}
          >
            <span className={styles.selectText} title={selectedTooltip}>
              {selectedDisplayText}
            </span>
            <span className={styles.icon} aria-hidden="true">
              <Icon name="dropdown-arrow" size={10} />
            </span>
          </button>
          {isOpen &&
            !disabled &&
            typeof document !== "undefined" &&
            menuPosition &&
            createPortal(
              <ul
                ref={listRef}
                id={listboxId}
                role="listbox"
                aria-labelledby={selectId}
                className={styles.optionsList}
                style={{
                  position: "fixed",
                  top: menuPosition.top,
                  left: menuPosition.left,
                  width: menuPosition.width,
                }}
              >
                {options?.map((option, index) => (
                  <li
                    key={option?.value}
                    id={`${selectId}-option-${index}`}
                    role="option"
                    aria-selected={option.value === currentValue}
                    title={option.label}
                    className={`${styles.option} ${
                      option.value === currentValue ? styles.selected : ""
                    } ${index === focusedIndex ? styles.focused : ""}`}
                    onClick={() => handleOptionClick(option)}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    <span className={styles.optionText}>{option.label}</span>
                  </li>
                ))}
              </ul>,
              document.body
            )}
        </div>

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

Select.displayName = "Select";

export default Select;
