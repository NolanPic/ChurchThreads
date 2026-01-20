"use client";

import { useId, forwardRef, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./MultiSelectComboBox.module.css";
import Icon from "./Icon";

// Utility function to merge refs
function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  return (value: T) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T>).current = value;
      }
    });
  };
}

export interface MultiSelectOption {
  text: string;
  value: string;
  [key: string]: unknown; // Allow additional properties for extensibility
}

export interface MultiSelectComboBoxProps<T extends MultiSelectOption = MultiSelectOption> {
  label?: string;
  options?: T[];
  renderOption?: (option: T) => React.ReactNode;
  renderSelection?: (option: T) => React.ReactNode;
  filter?: (option: T, searchTerm: string) => boolean;
  onChange?: (value: string, isDeselecting: boolean) => void;
  initialValues?: string[];
  values?: string[]; // Controlled mode: if provided, component uses this instead of internal state
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

function MultiSelectComboBoxInner<T extends MultiSelectOption = MultiSelectOption>(
  {
    label,
    options = [],
    renderOption,
    renderSelection,
    filter,
    onChange,
    initialValues = [],
    values,
    disabled = false,
    placeholder = "Search...",
    error,
    helperText,
    className,
    ...props
  }: MultiSelectComboBoxProps<T>,
  ref: React.ForwardedRef<HTMLInputElement>
) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [internalSelectedValues, setInternalSelectedValues] = useState<string[]>(initialValues);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const [menuPosition, setMenuPosition] = useState<{
      top: number;
      left: number;
      width: number;
    } | null>(null);

    // Determine if component is controlled
    const isControlled = values !== undefined;
    const selectedValues = isControlled ? values : internalSelectedValues;

    // Generate unique IDs for accessibility
    const generatedId = useId();
    const comboboxId = `multiselect-${generatedId}`;
    const listboxId = `${comboboxId}-listbox`;
    const errorId = error ? `${comboboxId}-error` : undefined;
    const helperTextId = helperText ? `${comboboxId}-helper` : undefined;
    const hasError = Boolean(error);

    // Default filter function with prefix match priority
    const defaultFilter = (option: T, term: string): boolean => {
      if (!term) return true;
      const lowerTerm = term.toLowerCase();
      const lowerText = option.text.toLowerCase();
      return lowerText.includes(lowerTerm);
    };

    // Score options for sorting (prefix matches score higher)
    const scoreOption = (option: T, term: string): number => {
      if (!term) return 0;
      const lowerTerm = term.toLowerCase();
      const lowerText = option.text.toLowerCase();

      if (lowerText.startsWith(lowerTerm)) {
        return 2; // Prefix match
      } else if (lowerText.includes(lowerTerm)) {
        return 1; // Substring match
      }
      return 0; // No match
    };

    // Filter and sort options
    const filterFunction = filter || defaultFilter;
    const filteredOptions = options
      .filter((option) => !selectedValues.includes(option.value))
      .filter((option) => filterFunction(option, searchTerm))
      .sort((a, b) => {
        const scoreA = scoreOption(a, searchTerm);
        const scoreB = scoreOption(b, searchTerm);
        if (scoreA !== scoreB) {
          return scoreB - scoreA; // Higher score first
        }
        return a.text.localeCompare(b.text); // Alphabetical fallback
      });

    // Get selected options for display
    const selectedOptions = selectedValues
      .map((value) => options.find((opt) => opt.value === value))
      .filter((opt): opt is T => opt !== undefined);

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
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen]);

    // Position the dropdown using a portal
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
          event.preventDefault();
          if (isOpen && focusedIndex >= 0 && filteredOptions[focusedIndex]) {
            handleOptionSelect(filteredOptions[focusedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setFocusedIndex(-1);
          setSearchTerm("");
          break;
        case "ArrowDown":
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setFocusedIndex(0);
          } else {
            const nextIndex = Math.min(
              focusedIndex + 1,
              filteredOptions.length - 1
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
        case "Backspace":
          // Remove last selected item if input is empty
          if (searchTerm === "" && selectedValues.length > 0) {
            event.preventDefault();
            const lastValue = selectedValues[selectedValues.length - 1];
            handleRemove(lastValue);
          }
          break;
      }
    };

    const handleOptionSelect = (option: T) => {
      if (!isControlled) {
        const newSelectedValues = [...selectedValues, option.value];
        setInternalSelectedValues(newSelectedValues);
      }
      onChange?.(option.value, false);
      setSearchTerm("");
      setFocusedIndex(-1);
      inputRef.current?.focus();
    };

    const handleRemove = (value: string) => {
      if (!isControlled) {
        const newSelectedValues = selectedValues.filter((v) => v !== value);
        setInternalSelectedValues(newSelectedValues);
      }
      onChange?.(value, true);
      inputRef.current?.focus();
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchTerm(value);
      if (!isOpen && value) {
        setIsOpen(true);
      }
      setFocusedIndex(-1);
    };

    const handleInputFocus = () => {
      if (!disabled && filteredOptions.length > 0) {
        setIsOpen(true);
      }
    };

    const toggleDropdown = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
        if (!isOpen) {
          inputRef.current?.focus();
        }
      }
    };

    const defaultRenderOption = (option: T) => option.text;
    const defaultRenderSelection = (option: T) => option.text;

    return (
      <div className={`${styles.wrapper} ${className || ""}`}>
        {label && (
          <label
            htmlFor={comboboxId}
            className={`${styles.label} ${disabled ? styles.disabled : ""}`}
          >
            {label}
          </label>
        )}

        <div
          className={`${styles.container} ${hasError ? styles.error : ""} ${disabled ? styles.disabled : ""}`}
          ref={containerRef}
        >
          <div className={styles.inputWrapper}>
            {selectedOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={styles.tag}
                onClick={() => handleRemove(option.value)}
                disabled={disabled}
                aria-label={`Remove ${option.text}`}
                title={option.text}
              >
                <span className={styles.tagText}>
                  {renderSelection ? renderSelection(option) : defaultRenderSelection(option)}
                </span>
                <span className={styles.removeIcon} aria-hidden="true">
                  ×
                </span>
              </button>
            ))}
            <input
              ref={mergeRefs(inputRef, ref)}
              id={comboboxId}
              type="text"
              role="combobox"
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                isOpen && focusedIndex >= 0
                  ? `${comboboxId}-option-${focusedIndex}`
                  : undefined
              }
              aria-describedby={
                [errorId, helperTextId].filter(Boolean).join(" ") || undefined
              }
              className={styles.input}
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              disabled={disabled}
              placeholder={selectedValues.length === 0 ? placeholder : ""}
              {...props}
            />
          </div>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={toggleDropdown}
            disabled={disabled}
            aria-label="Toggle options"
            tabIndex={-1}
          >
            <Icon name="dropdown-arrow" size={10} />
          </button>

          {isOpen &&
            !disabled &&
            typeof document !== "undefined" &&
            menuPosition &&
            filteredOptions.length > 0 &&
            createPortal(
              <ul
                ref={listRef}
                id={listboxId}
                role="listbox"
                aria-label={label || "Options"}
                className={styles.optionsList}
                style={{
                  position: "fixed",
                  top: menuPosition.top,
                  left: menuPosition.left,
                  width: menuPosition.width,
                }}
              >
                {filteredOptions.map((option, index) => (
                  <li
                    key={option.value}
                    id={`${comboboxId}-option-${index}`}
                    role="option"
                    aria-selected={index === focusedIndex}
                    className={`${styles.option} ${
                      index === focusedIndex ? styles.focused : ""
                    }`}
                    onClick={() => handleOptionSelect(option)}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    {renderOption ? renderOption(option) : defaultRenderOption(option)}
                  </li>
                ))}
              </ul>,
              document.body
            )}
        </div>

        {helperText && !error && (
          <div id={helperTextId} className={styles.helperText}>
            {helperText}
          </div>
        )}

        {error && (
          <div id={errorId} className={styles.errorMessage} role="alert">
            {error}
          </div>
        )}
      </div>
    );
}

// Create a properly typed forwardRef wrapper that supports generics
type MultiSelectComboBoxType = <T extends MultiSelectOption = MultiSelectOption>(
  props: MultiSelectComboBoxProps<T> & { ref?: React.ForwardedRef<HTMLInputElement> }
) => ReturnType<typeof MultiSelectComboBoxInner>;

export const MultiSelectComboBox = forwardRef(MultiSelectComboBoxInner) as MultiSelectComboBoxType & {
  displayName?: string;
};

MultiSelectComboBox.displayName = "MultiSelectComboBox";

export default MultiSelectComboBox;
