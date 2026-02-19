import {
  useEffect,
  useState,
  useRef,
  useId,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Input, InputHandle } from "./Input";
import styles from "./OneTimePassword.module.css";

export interface OneTimePasswordProps {
  slots?: number;
  error?: string;
  onComplete?: (code: string) => void;
  onChange?: (code: string) => void;
  className?: string;
}

export interface OneTimePasswordRef {
  clear: () => void;
  focus: () => void;
  getValue: () => string;
}

export const OneTimePassword = forwardRef<
  OneTimePasswordRef,
  OneTimePasswordProps
>(({ slots = 5, error, onComplete, onChange, className }, ref) => {
  const [values, setValues] = useState<string[]>(Array(slots).fill(""));
  const inputRefs = useRef<(InputHandle | null)[]>([]);
  const componentId = useId();
  const errorId = error ? `${componentId}-error` : undefined;

  useImperativeHandle(ref, () => ({
    clear: () => {
      setValues(Array(slots).fill(""));
      inputRefs.current[0]?.focus();
    },
    focus: () => {
      const firstEmptyIndex = values.findIndex((value) => !value);
      const indexToFocus = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      inputRefs.current[indexToFocus]?.focus();
    },
    getValue: () => values.join(""),
  }));

  const updateValues = (newValues: string[]) => {
    setValues(newValues);
    const code = newValues.join("");
    onChange?.(code);
  };

  useEffect(() => {
    const code = values.join("");
    if (code.length === slots && values.every((val) => val)) {
      onComplete?.(code);
    }
  }, [values, slots, onComplete]);

  const handleChange = (index: number, value: string) => {
    const newValue = value.slice(-1);
    const newValues = [...values];
    newValues[index] = newValue;
    updateValues(newValues);

    if (newValue && index < slots - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "Tab") {
      return;
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < slots - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\s/g, "");
    const newValues = [...values];

    for (let i = 0; i < Math.min(pastedData.length, slots); i++) {
      newValues[i] = pastedData[i];
    }

    updateValues(newValues);

    const nextEmptyIndex = newValues.findIndex((val) => !val);
    const focusIndex =
      nextEmptyIndex === -1 ? slots - 1 : Math.min(nextEmptyIndex, slots - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div
      className={`${styles.otpWrapper} ${className || ""}`}
      aria-describedby={errorId}
    >
      <div className={styles.slotsContainer}>
        {Array.from({ length: slots }, (_, index) => (
          <div key={index} className={styles.slotWrapper}>
            <Input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              label=""
              type="text"
              value={values[index]}
              className={styles.slot}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              maxLength={1}
              autoComplete="off"
              inputMode="numeric"
              pattern="[0-9]*"
              aria-label={`Digit ${index + 1} of ${slots}`}
            />
          </div>
        ))}
      </div>

      {error && (
        <div id={errorId} className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}
    </div>
  );
});

OneTimePassword.displayName = "OneTimePassword";
